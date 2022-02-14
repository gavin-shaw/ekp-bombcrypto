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

export default function element(): UiElement {
  return Container({
    children: [
      Row({
        children: [
          Col({
            children: [
              PageHeaderTile({
                title: 'Profit & Loss',
                icon: 'cil-bank',
              }),
            ],
          }),
        ],
      }),
      summaryRow(),
      tableRow(),
    ],
  });
}

function summaryRow() {
  return Row({
    children: [
      Col({
        className: 'col-xs-12 col-md-6',
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
      Col({
        className: 'cols-xs-12 col-md-6',
        children: [WalletSelector({ hideChains: true })],
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
