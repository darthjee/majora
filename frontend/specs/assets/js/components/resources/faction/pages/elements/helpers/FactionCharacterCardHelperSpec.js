import { renderToStaticMarkup } from 'react-dom/server';
import FactionCharacterCardHelper
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/helpers/FactionCharacterCardHelper.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('FactionCharacterCardHelper', function() {
  describe('.render', function() {
    it('renders the grid-cell column classes matching PossessionPreviewCard', function() {
      const character = {
        id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
      };
      const html = renderToStaticMarkup(FactionCharacterCardHelper.render(character, 'demo'));

      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('renders the default character avatar when photo_path is null', function() {
      const character = {
        id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
      };
      const html = renderToStaticMarkup(FactionCharacterCardHelper.render(character, 'demo'));

      expect(html).toContain('<img');
      expect(html).toContain('default_character.png');
    });

    it('renders the character photo when photo_path is provided', function() {
      const character = {
        id: 5, name: 'Aragorn', type: 'pc', photo_path: 'http://example.com/aragorn.png',
      };
      const html = renderToStaticMarkup(FactionCharacterCardHelper.render(character, 'demo'));

      expect(html).toContain('http://example.com/aragorn.png');
    });

    it('keeps the character name as the image alt text', function() {
      const character = {
        id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
      };
      const html = renderToStaticMarkup(FactionCharacterCardHelper.render(character, 'demo'));

      expect(html).toContain('alt="Aragorn"');
    });

    it('links a pc to the game pcs page', function() {
      const character = {
        id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
      };
      const html = renderToStaticMarkup(FactionCharacterCardHelper.render(character, 'demo'));

      expect(html).toContain('href="#/games/demo/pcs/5"');
    });

    it('links an npc to the game npcs page', function() {
      const character = {
        id: 8, name: 'Gandalf', type: 'npc', photo_path: null,
      };
      const html = renderToStaticMarkup(FactionCharacterCardHelper.render(character, 'demo'));

      expect(html).toContain('href="#/games/demo/npcs/8"');
    });

    it('renders the navigation link with the stretched-link utility class', function() {
      const character = {
        id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
      };
      const html = renderToStaticMarkup(FactionCharacterCardHelper.render(character, 'demo'));

      expect(html).toContain('stretched-link');
    });

    it('feeds only the character name to the tooltip content', function() {
      const character = {
        id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
      };
      const rendered = FactionCharacterCardHelper.render(character, 'demo');
      const actionsOverlay = rendered.props.children.props.children;
      const tooltip = actionsOverlay.props.children[0];

      expect(tooltip.props.content).toBe('Aragorn');
    });

    it('does not render a kick button when canKick is false', function() {
      const character = {
        id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
      };
      const html = renderToStaticMarkup(FactionCharacterCardHelper.render(character, 'demo', false));

      expect(html).not.toContain('bi-person-x');
    });

    it('renders a kick button when canKick is true', function() {
      const character = {
        id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
      };
      const html = renderToStaticMarkup(FactionCharacterCardHelper.render(character, 'demo', true));

      expect(html).toContain('bi-person-x');
      expect(html).toContain(Translator.t('faction_page.kick_button'));
    });

    it('invokes onKick with the character when the kick button is clicked', function() {
      const character = {
        id: 5, name: 'Aragorn', type: 'pc', photo_path: null,
      };
      const onKick = jasmine.createSpy('onKick');
      const rendered = FactionCharacterCardHelper.render(character, 'demo', true, onKick);
      const actionsOverlay = rendered.props.children.props.children;
      const kickButton = actionsOverlay.props.children[1];

      kickButton.props.onClick();

      expect(onKick).toHaveBeenCalledWith(character);
    });
  });
});
