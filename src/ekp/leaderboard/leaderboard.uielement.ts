import { chains, collection, documents } from '@earnkeeper/ekp-sdk-nestjs';
import {
  Col,
  Container,
  Datatable,
  DatatableColumn,
  formatCurrency,
  formatMaskAddress,
  formatTemplate,
  formatTimeToNow,
  isBusy,
  Link,
  PageHeaderTile,
  Row,
  UiElement,
} from '@earnkeeper/ekp-ui';
import { WalletDocument } from './wallet.document';

export default function element(): UiElement {
  return Container({
    children: [
      Row({
        children: [
          Col({
            children: [
              PageHeaderTile({
                title: 'Leaderboard',
                icon: 'cil-badge',
              }),
            ],
          }),
        ],
      }),
      tableRow(),
    ],
  });
}

function tableRow(): UiElement {
  return Row({
    children: [
      Col({
        children: [
          Datatable({
            columns: tableColumns(),
            data: documents(WalletDocument),
            defaultSortAsc: false,
            defaultSortFieldId: 'netUsd',
            filterable: false,
            pagination: true,
            isBusy: isBusy(collection(WalletDocument)),
          }),
        ],
      }),
    ],
  });
}

function tableColumns(): DatatableColumn[] {
  return [
    {
      id: 'address',
      cell: Link({
        external: true,
        externalIcon: true,
        content: formatMaskAddress('$.address'),
        href: formatTemplate(
          `${chains['bsc'].explorer}/address/{{ address }}`,
          { address: '$.address' },
        ),
      }),
    },
    {
      id: 'joined',
      value: '$.startTimestamp',
      label: formatTimeToNow('$.startTimestamp'),
    },
    {
      id: 'buyUsd',
      name: 'buy',
      label: formatCurrency('$.buyUsd', '$.fiatSymbol'),
    },
    {
      id: 'sellUsd',
      name: 'sell',
      label: formatCurrency('$.sellUsd', '$.fiatSymbol'),
    },
    {
      id: 'netUsd',
      name: 'net',
      sortable: true,
      label: formatCurrency('$.netUsd', '$.fiatSymbol'),
    },
  ];
}
