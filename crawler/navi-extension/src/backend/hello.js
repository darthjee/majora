import { RequestHandler } from 'navi-hey/extension';

class HelloHandler extends RequestHandler {
  constructor (_request, response) {
    super();
    this.response = response;
  }

  handle () {
    this.response.json({ extension: 'navi-loot-extension', status: 'ok' });
  }
}

export default [
  { method: 'GET', path: '/ext/loot/hello.json', handler: HelloHandler },
];
