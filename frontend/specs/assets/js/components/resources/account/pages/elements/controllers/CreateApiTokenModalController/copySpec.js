import CreateApiTokenModalController from '../../../../../../../../../../assets/js/components/resources/account/pages/elements/controllers/CreateApiTokenModalController.js';

describe('CreateApiTokenModalController#copy', function() {
  let setCopyStatus;
  let controller;
  let originalNavigator;

  const stubNavigator = (value) => {
    Object.defineProperty(globalThis, 'navigator', { value, configurable: true, writable: true });
  };

  beforeEach(function() {
    originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    setCopyStatus = jasmine.createSpy('setCopyStatus');
    controller = new CreateApiTokenModalController({ setCopyStatus });
  });

  afterEach(function() {
    if (originalNavigator) {
      Object.defineProperty(globalThis, 'navigator', originalNavigator);
    } else {
      delete globalThis.navigator;
    }
  });

  it('copies the token and reports success', async function() {
    const writeText = jasmine.createSpy('writeText').and.resolveTo();
    stubNavigator({ clipboard: { writeText } });

    await controller.copy('mjr_secret');

    expect(writeText).toHaveBeenCalledWith('mjr_secret');
    expect(setCopyStatus).toHaveBeenCalledWith('copied');
  });

  it('reports a failure when the clipboard rejects', async function() {
    stubNavigator({ clipboard: { writeText: jasmine.createSpy('writeText').and.rejectWith(new Error('denied')) } });

    await controller.copy('mjr_secret');

    expect(setCopyStatus).toHaveBeenCalledWith('failed');
  });

  it('reports a failure when the clipboard API is missing', async function() {
    stubNavigator({});

    await controller.copy('mjr_secret');

    expect(setCopyStatus).toHaveBeenCalledWith('failed');
  });
});
