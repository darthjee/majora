import { renderToStaticMarkup } from 'react-dom/server';
import AppHelper from '../../../../../../assets/js/components/helpers/AppHelper.jsx';

export const runCases = (cases) => {
  cases.forEach(({ page, hash, expected, lang }) => {
    it(`renders ${page}`, function() {
      const resolvedExpected = typeof expected === 'function' ? expected() : expected;

      expect(renderToStaticMarkup(AppHelper.render(page, hash, lang))).toContain(resolvedExpected);
    });
  });
};
