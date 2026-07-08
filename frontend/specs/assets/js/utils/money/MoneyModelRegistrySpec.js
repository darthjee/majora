import MoneyModelRegistry from '../../../../../assets/js/utils/money/MoneyModelRegistry.js';

describe('MoneyModelRegistry', function() {
  describe('.register / .resolve', function() {
    it('resolves a previously registered model class by name', function() {
      class FakeModel {}

      MoneyModelRegistry.register('fake', FakeModel);

      expect(MoneyModelRegistry.resolve('fake')).toBe(FakeModel);
    });

    it('overwrites a previously registered model under the same name', function() {
      class FirstModel {}
      class SecondModel {}

      MoneyModelRegistry.register('overwritable', FirstModel);
      MoneyModelRegistry.register('overwritable', SecondModel);

      expect(MoneyModelRegistry.resolve('overwritable')).toBe(SecondModel);
    });

    it('throws a clear error when resolving an unknown name', function() {
      expect(() => MoneyModelRegistry.resolve('unknown-model'))
        .toThrowError('Unknown money model: unknown-model');
    });
  });
});
