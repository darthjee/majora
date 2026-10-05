import { DURATION_BIN_KEYS, durationBinKey }
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/helpers/durationBins.js';

describe('durationBins', function() {
  describe('DURATION_BIN_KEYS', function() {
    it('maps the 8 bins', function() {
      expect(Object.keys(DURATION_BIN_KEYS).length).toBe(8);
    });
  });

  describe('durationBinKey', function() {
    const cases = [
      [0, 'zero'],
      [1, 'under_30s'],
      [30, '30s_1m'],
      [60, '1m_3m'],
      [180, '3m_10m'],
      [600, '10m_30m'],
      [1800, '30m_1h'],
      [3600, 'over_1h'],
    ];

    cases.forEach(([lower, key]) => {
      it(`maps ${lower} to ${key}`, function() {
        expect(durationBinKey(lower)).toBe(key);
      });
    });

    it('returns null for an unknown bound', function() {
      expect(durationBinKey(42)).toBeNull();
    });
  });
});
