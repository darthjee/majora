import { renderToStaticMarkup } from 'react-dom/server';
import CharacterLinksFieldHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterLinksFieldHelper.jsx';
import { buildLink } from '../../../../../../../../support/factories.js';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CharacterLinksFieldHelper', function() {
  describe('.render', function() {
    it('renders the links as a read-only LinkList', function() {
      const html = renderToStaticMarkup(
        CharacterLinksFieldHelper.render(
          [buildLink({ text: 'Wiki', url: 'https://example.com/wiki' })], 'Edit links', Noop.noop
        )
      );
      expect(html).toContain('href="https://example.com/wiki"');
      expect(html).toContain('Wiki');
    });

    it('filters out links marked delete: true', function() {
      const html = renderToStaticMarkup(
        CharacterLinksFieldHelper.render(
          [
            buildLink({ text: 'Wiki', url: 'https://example.com/wiki' }),
            buildLink({ id: 2, text: 'Old link', url: 'https://example.com/old', delete: true }),
          ],
          'Edit links',
          Noop.noop,
        )
      );
      expect(html).toContain('href="https://example.com/wiki"');
      expect(html).not.toContain('href="https://example.com/old"');
    });

    it('renders the button label', function() {
      const html = renderToStaticMarkup(CharacterLinksFieldHelper.render([], 'Edit links', Noop.noop));
      expect(html).toContain('Edit links');
    });
  });
});
