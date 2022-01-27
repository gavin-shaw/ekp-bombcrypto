import helloWorld from '../hello-world/hello-world.uielement';


export default function pages() {
  return [
    {
      id: 'bombcrypto/hello-world',
      element: helloWorld(),
    },
  ];
}
