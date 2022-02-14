import {
  parseEvmAddress,
  parseStartOfDay,
  TRANSFER_TOPIC,
} from '@earnkeeper/ekp-sdk';
import {
  ApmService,
  FiatPrice,
  LimiterService,
  logger,
  PriceService,
  TransactionLog,
} from '@earnkeeper/ekp-sdk-nestjs';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import Bottleneck from 'bottleneck';
import { Queue } from 'bull';
import { validate } from 'bycontract';
import { BigNumber, ethers } from 'ethers';
import _ from 'lodash';
import moment from 'moment';
import {
  BombcryptoWallet,
  BombcryptoWalletRepository,
  TransactionLogRepository,
} from '../../db';
import { BCOIN_CONTRACT_ADDRESS } from '../../util';
import { PNL_QUEUE } from '../queues';

const JOB_UPDATE_WALLETS = 'JOB_UPDATE_WALLETS';

@Processor(PNL_QUEUE)
export class UpdateWalletsProcessor {
  private queueAddMutex: Bottleneck;

  constructor(
    private apmService: ApmService,
    limiterService: LimiterService,
    private logRepository: TransactionLogRepository,
    @InjectQueue(PNL_QUEUE) private pnlQueue: Queue,
    private priceService: PriceService,
    private walletRepository: BombcryptoWalletRepository,
  ) {
    this.queueAddMutex = limiterService.createMutex(
      `${UpdateWalletsProcessor.name}-${JOB_UPDATE_WALLETS}`,
    );
  }

  async onModuleInit() {
    // Use a redis mutex here to prevent race conditions on start up
    await this.queueAddMutex.schedule(async () => {
      await this.pnlQueue.add(JOB_UPDATE_WALLETS, undefined, {
        jobId: JOB_UPDATE_WALLETS,
        delay: 20000,
      });
    });
  }

  @Process({ name: JOB_UPDATE_WALLETS, concurrency: 1 })
  async processUpdateWallets() {
    logger.log(`[${JOB_UPDATE_WALLETS}] Job started.`);
    const started = moment().unix();
    const transaction = this.apmService.startTransaction({
      name: JOB_UPDATE_WALLETS,
    });

    try {
      let span = transaction?.startChild({
        op: 'fetchBcoinPrices',
      });
      const { bcoinPriceMap, firstBcoinPrice } = await this.fetchBcoinPrices();
      span?.finish();

      span = transaction?.startChild({
        op: 'findWallets',
      });
      const { walletMap, walletCount, blockHeight, timestampHeight } =
        await this.findWallets();
      span?.finish();

      logger.log(
        `[${JOB_UPDATE_WALLETS}] Loaded ${walletCount} existing wallets, ` +
          `block ${blockHeight}, ` +
          `timestamp ${moment.unix(timestampHeight)}`,
      );

      let nextBlockHeight = blockHeight;

      while (true) {
        span = transaction?.startChild({
          op: 'parseNextLogs',
        });
        const { blockNumber, count } = await this.parseNextLogs(
          nextBlockHeight,
          walletMap,
          bcoinPriceMap,
          firstBcoinPrice,
        );
        span?.finish();

        if (count === 0) {
          break;
        }
        nextBlockHeight = blockNumber;
      }
      logger.log(
        `[${JOB_UPDATE_WALLETS}] Job complete. ${
          moment().unix() - started
        } seconds.`,
      );

      transaction?.finish();
    } catch (error) {
      console.error(error);
      this.apmService.captureError(error);
      throw error;
    } finally {
      setTimeout(() => {
        this.pnlQueue.add(JOB_UPDATE_WALLETS, undefined, {
          jobId: JOB_UPDATE_WALLETS,
        });
      }, 60000);
    }
  }

  private async fetchBcoinPrices() {
    const bcoinPrices = await this.priceService.dailyFiatPricesOf(
      'bsc',
      BCOIN_CONTRACT_ADDRESS,
      'usd',
    );

    const bcoinPriceMap = _.chain(bcoinPrices)
      .groupBy('timestamp')
      .mapValues((values) => values[0])
      .value();

    const firstBcoinPrice = _.chain(bcoinPrices)
      .sortBy('timestamp')
      .first()
      .value();

    return { bcoinPriceMap, firstBcoinPrice };
  }

  private async findWallets() {
    // Fetch all wallets from db, this will be memory intensive
    const wallets = await this.walletRepository.findAllWalletsByBlockHeight();

    // Get summary statistics
    const walletCount = wallets.length;
    const blockHeight = _.chain(wallets).first().get('blockHeight', 0).value();
    const timestampHeight = _.chain(wallets)
      .first()
      .get('endTimestamp', 0)
      .value();

    // Convert the array result to a map for effecient lookup later
    // (For a short while this will use 2N memory, but only for the life of this method)
    const walletMap = _.chain(wallets)
      .groupBy('address')
      .mapValues((wallets) => wallets[0])
      .value();

    return { walletMap, walletCount, blockHeight, timestampHeight };
  }

  private async parseNextLogs(
    blockHeight: number,
    walletMap: Record<string, BombcryptoWallet>,
    bcoinPriceMap: Record<string, FiatPrice>,
    firstBcoinPrice: FiatPrice,
  ) {
    validate(
      [blockHeight, walletMap, bcoinPriceMap, firstBcoinPrice],
      [
        'number',
        'Object.<string, object>',
        'Object.<string, object>',
        'object',
      ],
    );

    let blockNumber = blockHeight;

    const nextLogs = await this.logRepository.findByTopic0PageByBlockNumber(
      'bsc',
      BCOIN_CONTRACT_ADDRESS,
      TRANSFER_TOPIC,
      blockHeight,
    );

    if (nextLogs.length > 0) {
      logger.log(
        `[${JOB_UPDATE_WALLETS}] Fetched ${nextLogs.length} transaction logs`,
      );

      const updatedWallets = <Record<string, BombcryptoWallet>>{};

      for (const log of nextLogs) {
        const midnightKey = parseStartOfDay(log.blockTimestamp).toString();

        const bcoinPrice = bcoinPriceMap[midnightKey] ?? firstBcoinPrice;

        const { wallet1, wallet2 } = this.mapWallets(
          walletMap,
          bcoinPrice,
          log,
        );

        updatedWallets[wallet1.address] = wallet1;
        updatedWallets[wallet2.address] = wallet2;

        blockNumber = log.blockNumber;
      }

      const updatedWalletsList = _.chain(updatedWallets).values().value();

      await this.walletRepository.saveWallets(updatedWalletsList);

      logger.log(
        `[${JOB_UPDATE_WALLETS}] Wrote ${updatedWalletsList.length} updated wallets`,
      );
    }

    return { blockNumber, count: nextLogs.length };
  }

  private mapWallets(
    walletMap: Record<string, BombcryptoWallet>,
    bcoinPrice: FiatPrice,
    log: TransactionLog,
  ) {
    const address1 = parseEvmAddress(log.topic1);
    const address2 = parseEvmAddress(log.topic2);

    let wallet1 = walletMap[address1];
    let wallet2 = walletMap[address2];

    if (!wallet1) {
      wallet1 = this.walletRepository.createWallet(
        address1,
        log.blockNumber,
        log.blockTimestamp,
      );
    }

    if (!wallet2) {
      wallet2 = this.walletRepository.createWallet(
        address2,
        log.blockNumber,
        log.blockTimestamp,
      );
    }

    const value: number =
      log.data === '0x'
        ? BigNumber.from(0).toNumber()
        : Number(ethers.utils.formatEther(log.data));

    wallet1.sell += value;
    wallet2.buy += value;

    wallet1.sellUsd += value * bcoinPrice.price;
    wallet2.buyUsd += value * bcoinPrice.price;

    walletMap[wallet1.address] = wallet1;
    walletMap[wallet2.address] = wallet2;

    return { wallet1, wallet2 };
  }
}
