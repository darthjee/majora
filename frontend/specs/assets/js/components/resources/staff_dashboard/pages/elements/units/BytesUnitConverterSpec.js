import BytesUnitConverter from '../../../../../../../../../assets/js/components/resources/staff_dashboard/pages/elements/units/BytesUnitConverter.js';

describe('BytesUnitConverter', function() {
  describe('.convert', function() {
    [
      { rawValue: 0, expectedUnit: 'B', expectedValue: 0 },
      { rawValue: 500, expectedUnit: 'B', expectedValue: 500 },
      { rawValue: 920, expectedUnit: 'B', expectedValue: 920 },
      { rawValue: 921, expectedUnit: 'KB', expectedValue: 921 / 1024.0 },
      { rawValue: 943103, expectedUnit: 'KB', expectedValue: 943103 / 1024.0 },
      { rawValue: 943104, expectedUnit: 'MB', expectedValue: 943104 / 1048576.0 },
      { rawValue: 965738495, expectedUnit: 'MB', expectedValue: 965738495 / 1048576.0 },
      { rawValue: 965738496, expectedUnit: 'GB', expectedValue: 965738496 / 1073741824.0 },
      { rawValue: 2147483648, expectedUnit: 'GB', expectedValue: 2147483648 / 1073741824.0 },
    ].forEach(({ rawValue, expectedUnit, expectedValue }) => {
      it(`converts ${rawValue} to unit '${expectedUnit}'`, function() {
        const result = BytesUnitConverter.convert(rawValue);

        expect(result.unit).toBe(expectedUnit);
        expect(result.value).toBeCloseTo(expectedValue, 6);
      });
    });
  });
});
