import { faker } from '@faker-js/faker';
import moment from 'moment';

describe('faker', () => {
  test('faker', async () => {
    for (let index = 0; index < 3; index++) {
      console.log(
        faker.finance.ethereumAddress(),
        moment(faker.date.recent(160)).fromNow(),
        faker.datatype.number({ min: 10, max: 1000 }),
        faker.datatype.number({ min: 1000, max: 100000 }),
        faker.datatype.number({ min: 1000, max: 100000 }),
        faker.datatype.number({ min: 10, max: 10000 }),
      );
    }
  });
});
