import { collection, documents, path } from '@earnkeeper/ekp-sdk';
import {
  Col,
  Container,
  Datatable,
  DatatableColumn,
  formatCurrency,
  formatTemplate,
  formatTimeToNow,
  formatToken,
  isBusy,
  jsonArray,
  Link,
  PageHeaderTile,
  Row,
  RpcOrPrimitive,
  sum,
  SummaryStats,
  UiElement,
  WalletSelector,
} from '@earnkeeper/ekp-ui';
import { MyPnlDocument } from './leaderboard-pnl.document';

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
                  sum(`${path(MyPnlDocument)}..costBasisFiat`),
                  `${path(MyPnlDocument)}..fiatSymbol`,
                ),
              },
              {
                label: 'Realized Value',
                value: formatCurrency(
                  sum(`${path(MyPnlDocument)}..realizedValueFiat`),
                  `${path(MyPnlDocument)}..fiatSymbol`,
                ),
              },
              {
                label: 'Unrealized BCOIN',
                value: formatCurrency(
                  `$.tokenBalances[?(@.tokenSymbol == 'BCOIN')].balanceFiat`,
                  `${path(MyPnlDocument)}..fiatSymbol`,
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
            data: documents(MyPnlDocument),
            defaultSortAsc: false,
            defaultSortFieldId: 'timestamp',
            filterable: false,
            pagination: false,
            isBusy: isBusy(collection(MyPnlDocument)),
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

export function context(): RpcOrPrimitive {
  return jsonArray(
    formatTemplate(
      `${path(MyPnlDocument)}[?(@.ownerAddress == "{{ ownerAddress }}")]`,
      {
        ownerAddress: '$.location.pathParams[1]',
      },
    ),
  );
}
