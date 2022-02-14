import { TransactionLog, TransactionService } from '@earnkeeper/ekp-sdk-nestjs';
import { Injectable } from '@nestjs/common';

export const MAX_RESULTS = 20000;

@Injectable()
export class TransactionLogRepository {
  constructor(private transactionService: TransactionService) {}

  findByTopic0PageByBlockNumber(
    chain: string,
    address: string,
    topic0: string,
    blockNumber: number,
    maxResults = MAX_RESULTS,
  ): Promise<TransactionLog[]> {
    return this.transactionService.transactionLogModel
      .find({
        ownerChain: chain,
        address,
        topic0,
        blockNumber: {
          $gt: blockNumber, // TODO: use an _objectId here as well to avoid missing blocks during the range query
        },
      })
      .sort({ blockNumber: 1 })
      .limit(maxResults)
      .exec();
  }
}
