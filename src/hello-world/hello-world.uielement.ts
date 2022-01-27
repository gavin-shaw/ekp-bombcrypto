import { documents } from '@earnkeeper/ekp-sdk-nestjs';
import {
  Col,
  Container,
  Datatable,
  DatatableColumn,
  PageHeaderTile,
  Row,
  UiElement,
} from '@earnkeeper/ekp-ui';
import { HelloWorldDocument } from './hello-world.document';

export default function element(): UiElement {
  return Container({
    children: [
      Row({
        children: [
          Col({
            children: [
              PageHeaderTile({
                title: 'Hello World',
                icon: 'cil-bullhorn',
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
            data: documents(HelloWorldDocument),
            defaultSortAsc: true,
            defaultSortFieldId: 'expiresIn',
            filterable: false,
            pagination: false,
          }),
        ],
      }),
    ],
  });
}

function tableColumns(): DatatableColumn[] {
  return [
    {
      id: 'name',
      value: '$.name',
    },
    {
      id: 'value',
      value: '$.value',
    },
  ];
}
