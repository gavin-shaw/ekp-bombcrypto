import 'dotenv/config';
import mongoose from 'mongoose';
import Moralis from 'moralis/node';

const BCOIN_CONTRACT_ADDRESS = '0x00e1656e45f18ec6747f5a8496fd39b50b38396d';
const BscTransaction = mongoose.model(
  'BscTransaction',
  new mongoose.Schema({
    block_timestamp: 'string',
    from_address: 'string',
    to_address: 'string',
  }),
  'BscTransactions',
);

describe('moralis sync', () => {
  const address = BCOIN_CONTRACT_ADDRESS;
  jest.setTimeout(120000);

  beforeAll(async () => {
    await Moralis.start({
      serverUrl: process.env.MORALIS_SERVER_URL,
      appId: process.env.MORALIS_APP_ID,
      masterKey: process.env.MORALIS_MASTER_KEY,
    });

    await Moralis.Cloud.run(
      'watchBscAddress',
      {
        address,
        sync_historical: true,
      },
      { useMasterKey: true },
    );

    console.time('connect');
    await mongoose.connect(process.env.MORALIS_MONGO_URL);
    console.timeEnd('connect');
  });

  test.skip('query time', async () => {
    console.time('query');
    const transactions = await BscTransaction.find({
      $or: [{ from_address: address }, { to_address: address }],
    })
      .limit(1000)
      .exec();
    console.timeEnd('query');

    expect(transactions.length).toBeGreaterThan(0);
  });

  test('sync progress', async () => {
    console.time('query');
    const transaction = await BscTransaction.findOne({
      $or: [{ from_address: address }, { to_address: address }],
    })
      .sort('block_number')
      .exec();
    console.timeEnd('query');
    console.log(transaction.block_timestamp);

    console.time('query');
    const count = await BscTransaction.count({
      $or: [{ from_address: address }, { to_address: address }],
    }).exec();

    console.log(count);
    console.timeEnd('query');
  });
});
