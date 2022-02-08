import { path } from '@earnkeeper/ekp-sdk-nestjs';
import {
  Col,
  Container,
  DefaultProps,
  formatCurrency,
  formatTemplate,
  formatToken,
  Icon,
  Image,
  PageHeaderTile,
  Row,
  Rpc,
  UiElement,
} from '@earnkeeper/ekp-ui';
import fs from 'fs';
import { IntroDocument } from './intro.document';

export default function element(): UiElement {
  return Container({
    children: [
      headerRow(),
      Row({
        className: 'mt-2',
        children: [
          Col({
            className: 'col-12 col-md-6',
            children: [infoRow()],
          }),
          Col({
            className: 'col-12 col-md-6',
            children: [imagesRow()],
          }),
        ],
      }),
    ],
  });
}

function headerRow(): UiElement {
  return Row({
    children: [
      Col({
        className: 'col-auto',
        children: [
          PageHeaderTile({
            title: 'Bomb Crypto',
            icon: 'cil-info',
          }),
        ],
      }),
      Col({
        children: [],
      }),
      Col({
        className: 'col-auto my-auto',
        children: [
          Link({
            content: formatTemplate('BCOIN {{ price }}', {
              price: formatCurrency(
                `${path(IntroDocument)}..bcoinPrice`,
                `${path(IntroDocument)}..fiatSymbol`,
              ),
            }),
            href: 'https://www.coingecko.com/en/coins/bomber-coin',
            external: true,
            externalIcon: true,
          }),
        ],
      }),
      Col({
        className: 'col-auto my-auto pr-3',
        children: [socialsRow()],
      }),
    ],
  });
}

export function socialsRow() {
  return Row({
    children: [
      Col({
        children: [
          Link({
            className: 'flex-fill text-body',
            content: Icon({
              name: 'cib-youtube',
              size: 'lg',
            }),
            href: 'https://bit.ly/bombcrypto',
            external: true,
          }),
        ],
      }),
      Col({
        children: [
          Link({
            className: 'flex-fill text-body',
            content: Icon({
              name: 'cib-facebook',
              size: 'lg',
            }),
            href: 'https://www.facebook.com/BombCryptoGame',
            external: true,
          }),
        ],
      }),
      Col({
        children: [
          Link({
            className: 'flex-fill text-body',
            content: Icon({
              name: 'cib-twitter',
              size: 'lg',
            }),
            href: 'https://twitter.com/BombCryptoGame',
            external: true,
          }),
        ],
      }),
      Col({
        children: [
          Link({
            className: 'flex-fill text-body',
            content: Icon({
              name: 'cib-discord',
              size: 'lg',
            }),
            href: 'https://discord.link/bombcrypto',
            external: true,
          }),
        ],
      }),
    ],
  });
}

export function infoRow() {
  return Markdown({
    content: formatTemplate(staticFileContents('static/intro/intro.md'), {
      heroNftPrice: formatCurrency(
        `${path(IntroDocument)}..heroNftPrice`,
        `${path(IntroDocument)}..fiatSymbol`,
      ),
      sendYourHeroEvery: `${path(IntroDocument)}..sendYourHeroEvery`,
      earnEvery: `${path(IntroDocument)}..earnEvery`,
      earnAmount: formatCurrency(
        `${path(IntroDocument)}..earnAmount`,
        `${path(IntroDocument)}..fiatSymbol`,
      ),
      earnPerDay: formatCurrency(
        `${path(IntroDocument)}..earnPerDay`,
        `${path(IntroDocument)}..fiatSymbol`,
      ),
      gameUpTime: `${path(IntroDocument)}..gameUpTime`,
      numPlayers: formatToken(`${path(IntroDocument)}..numPlayers`),
      biggestWinnerAmount: formatCurrency(
        `${path(IntroDocument)}..biggestWinnerAmount`,
        `${path(IntroDocument)}..fiatSymbol`,
      ),
      biggestLoserAmount: formatCurrency(
        `${path(IntroDocument)}..biggestLoserAmount`,
        `${path(IntroDocument)}..fiatSymbol`,
      ),
    }),
  });
}

export function imagesRow() {
  return Row({
    className: 'pt-2',
    children: [
      Col({
        className: 'col-12 px-3 pb-3',
        children: [
          Image({
            className: 'w-100',
            src: 'https://leveldash.com/wp-content/uploads/Bomber-Heroes-in-Bomb-Crypto-mining-for-treasure-chests-and-earn-BCOIN-600x408.jpg',
          }),
        ],
      }),
      Col({
        className: 'col-12 px-3 pb-3',
        children: [
          Image({
            className: 'w-100',
            src: 'https://i.ytimg.com/vi/RYI7KInfiIk/maxresdefault.jpg',
          }),
        ],
      }),
    ],
  });
}

export function Markdown(props: MarkdownProps): UiElement {
  return {
    _type: 'Markdown',
    props,
  };
}

export interface MarkdownProps extends DefaultProps {
  content: string | Rpc;
}

export function staticFileContents(
  path: string,
  encoding: BufferEncoding = 'utf-8',
) {
  return fs.readFileSync(path, { encoding });
}

export function Link(props: LinkProps): UiElement {
  return {
    _type: 'Link',
    props,
  };
}

export interface LinkProps extends DefaultProps {
  content: UiElement | Rpc | string;
  href: Rpc | string;
  external?: boolean;
  externalIcon?: boolean;
}
