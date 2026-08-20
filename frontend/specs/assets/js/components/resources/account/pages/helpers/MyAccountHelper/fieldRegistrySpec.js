import { FIELD_REGISTRY } from '../../../../../../../../../assets/js/components/resources/account/pages/helpers/MyAccountHelper.jsx';

describe('MyAccountHelper', function() {
  describe('FIELD_REGISTRY', function() {
    it('has unique ids', function() {
      const ids = FIELD_REGISTRY.map((entry) => entry.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
