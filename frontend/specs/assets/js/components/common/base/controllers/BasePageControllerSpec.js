import BasePageController from '../../../../../../../assets/js/components/common/base/controllers/BasePageController.js';

describe('BasePageController', function() {
  it('only sets value while mounted', function() {
    const setter = jasmine.createSpy('setter');
    let mounted = true;
    const safeSet = new BasePageController().buildSafeSetter(() => mounted);

    safeSet(setter, 'value');
    mounted = false;
    safeSet(setter, 'other');

    expect(setter.calls.allArgs()).toEqual([['value']]);
  });
});
