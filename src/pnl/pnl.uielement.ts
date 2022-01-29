import { collection, documents, path } from '@earnkeeper/ekp-sdk-nestjs';
import {
  Col,
  Container,
  Datatable,
  DatatableColumn,
  formatCurrency,
  formatTimeToNow,
  formatToken,
  isBusy,
  Link,
  PageHeaderTile,
  Row,
  sum,
  SummaryStats,
  UiElement,
  WalletSelector,
} from '@earnkeeper/ekp-ui';
import { PnlDocument } from './pnl.document';
import { BCOIN_CONTRACT_ADDRESS } from '../util/constants';

export default function element(): UiElement {
  return Container({
    children: [
      Row({
        children: [
          Col({
            children: [
              PageHeaderTile({
                title: 'P & L',
                icon: 'cil-bank',
              }),
            ],
          }),
          Col({
            children: [WalletSelector({ hideChains: true })],
          }),
        ],
      }),
      summaryStats(),
      tableRow(),
    ],
  });
}

function summaryStats() {
  return Row({
    children: [
      Col({
        children: [
          SummaryStats({
            rows: [
              {
                label: 'Cost Basis',
                value: formatCurrency(
                  sum(`${path(PnlDocument)}..costBasisFiat`),
                  `${path(PnlDocument)}..fiatSymbol`,
                ),
              },
              {
                label: 'Realized Value',
                value: formatCurrency(
                  sum(`${path(PnlDocument)}..realizedValueFiat`),
                  `${path(PnlDocument)}..fiatSymbol`,
                ),
              },
            ],
          }),
        ],
      }),
      Col({
        children: [
          SummaryStats({
            rows: [
              {
                label: 'Unrealized BCOIN',
                value: formatCurrency(
                  `$.tokenBalances[?(@.tokenSymbol == 'BCOIN')].balanceFiat`,
                  `${path(PnlDocument)}..fiatSymbol`,
                ),
              },
            ],
          }),
        ],
      }),
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
            data: documents(PnlDocument),
            defaultSortAsc: false,
            defaultSortFieldId: 'timestamp',
            filterable: false,
            pagination: false,
            isBusy: isBusy(collection(PnlDocument)),
          }),
        ],
      }),
    ],
  });
}

function tableColumns(): DatatableColumn[] {
  return [
    {
      id: 'timestamp',
      label: formatTimeToNow('$.timestamp'),
      width: '150px',
    },
    {
      id: 'block',
      value: '$.block',
      cell: Link({
        content: '$.block',
        external: true,
        href: '$.txlink',
      }),
      grow: 0,
    },
    {
      id: 'action',
    },
    {
      id: 'bcoin',
      value: '$.bcoinValue',
      label: formatToken('$.bcoinValue'),
      grow: 0,
    },
    {
      id: 'gas',
      value: '$.gasFiatValue',
      label: formatCurrency('$.gasFiatValue', '$.fiatSymbol'),
      grow: 0,
    },
    {
      id: 'pnl',
      name: 'P & L',
      value: '$.pnlFiatValue',
      label: formatCurrency('$.pnlFiatValue', '$.fiatSymbol'),
      grow: 0,
    },
  ];
}
