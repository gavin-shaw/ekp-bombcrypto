import intro from '../intro/intro.uielement';
import leaderboard from '../leaderboard/leaderboard.uielement';
import pnl from '../my-pnl/my-pnl.uielement';

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
    {
      id: 'bombcrypto/leaderboard',
      element: leaderboard(),
    },
  ];
}
