import { renderToStaticMarkup } from 'react-dom/server';
import CharacterRoleHelper
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/CharacterRoleHelper.jsx';

describe('CharacterRoleHelper', function() {
  describe('.render', function() {
    it('renders the role when present', function() {
      const html = renderToStaticMarkup(CharacterRoleHelper.render('Ranger'));
      expect(html).toContain('Ranger');
    });

    it('returns null when role is absent', function() {
      expect(CharacterRoleHelper.render()).toBeNull();
    });

    it('returns null when role is an empty string', function() {
      expect(CharacterRoleHelper.render('')).toBeNull();
    });
  });
});
