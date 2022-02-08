import intro from '../intro/intro.uielement';
import pnl from '../pnl/pnl.uielement';

export default function pages() {
  return [
    {
      id: 'bombcrypto/pnl',
      element: pnl(),
    },
    {
      id: 'bombcrypto/intro',
      element: intro(),
    },
  ];
}
