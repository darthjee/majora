import HashRouteResolver from '../../../../../../assets/js/utils/routing/HashRouteResolver.js';

export const runCases = (cases) => {
  cases.forEach(({ hash, expected, description }) => {
    it(description ?? `resolves ${hash}`, function() {
      expect(new HashRouteResolver(() => hash).getPage()).toBe(expected);
    });
  });
};
