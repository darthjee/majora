import UnitConverters from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/units/UnitConverters.js';
import BytesUnitConverter from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverter.js';

describe('UnitConverters', function() {
  describe('.forType', function() {
    it('resolves the converter registered for `bytes`', function() {
      expect(UnitConverters.forType('bytes')).toBe(BytesUnitConverter);
    });

    it('throws when the value type is not registered', function() {
      expect(() => UnitConverters.forType('unknown')).toThrowError(
        "No unit converter registered for value type 'unknown'"
      );
    });
  });

  describe('.formatValue', function() {
    [
      { value: 2, expected: '2' },
      { value: 2.5, expected: '2.5' },
      { value: 920.999, expected: '921' },
      { value: 0, expected: '0' },
    ].forEach(({ value, expected }) => {
      it(`formats ${value} as '${expected}'`, function() {
        expect(UnitConverters.formatValue(value)).toBe(expected);
      });
    });
  });
});
