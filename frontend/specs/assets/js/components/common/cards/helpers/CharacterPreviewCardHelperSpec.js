import { renderToStaticMarkup } from 'react-dom/server';
import CharacterPreviewCardHelper
  from '../../../../../../../assets/js/components/common/cards/helpers/CharacterPreviewCardHelper.jsx';
import { buildCharacter } from '../../../../../../support/factories.js';

describe('CharacterPreviewCardHelper', function() {
  const character = buildCharacter({ id: 42, name: 'Aragorn' });
  const gameSlug = 'epic-quest';

  describe('.render', function() {
    it('renders the grid-cell column classes matching SeeAllCard', function() {
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(character, gameSlug, 'pc'));
      expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
    });

    it('links to the pc character detail page when characterType is pc', function() {
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(character, gameSlug, 'pc'));
      expect(html).toContain('href="#/games/epic-quest/pcs/42"');
    });

    it('links to the npc character detail page when characterType is npc', function() {
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(character, gameSlug, 'npc'));
      expect(html).toContain('href="#/games/epic-quest/npcs/42"');
    });

    it('renders the default avatar when profile_photo_path is null', function() {
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(character, gameSlug, 'pc'));
      expect(html).toContain('<img');
      expect(html).toContain('default_character.png');
    });

    it('renders the avatar image when profile_photo_path is provided', function() {
      const c = { ...character, profile_photo_path: 'http://example.com/aragorn.png' };
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(c, gameSlug, 'pc'));
      expect(html).toContain('http://example.com/aragorn.png');
    });

    it('keeps the character name as the image alt text', function() {
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(character, gameSlug, 'pc'));
      expect(html).toContain('alt="Aragorn"');
    });

    it('applies grayscale for a slain character', function() {
      const c = { ...character, slain: true };
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(c, gameSlug, 'npc'));
      expect(html).toContain('photo-grayscale');
    });

    it('does not apply grayscale for a non-slain character', function() {
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(character, gameSlug, 'npc'));
      expect(html).not.toContain('photo-grayscale');
    });

    it('applies the green border class for an allied NPC', function() {
      const c = { ...character, allegiance: 'ally' };
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(c, gameSlug, 'npc'));
      expect(html).toContain('border-success');
    });

    it('applies the red border class for an enemy NPC', function() {
      const c = { ...character, allegiance: 'enemy' };
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(c, gameSlug, 'npc'));
      expect(html).toContain('border-danger');
    });

    it('applies the gray border class for a neutral NPC', function() {
      const c = { ...character, allegiance: 'neutral' };
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(c, gameSlug, 'npc'));
      expect(html).toContain('border-secondary');
    });

    it('applies the gray border class for an NPC with a missing allegiance', function() {
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(character, gameSlug, 'npc'));
      expect(html).toContain('border-secondary');
    });

    it('does not apply any border class for a PC, regardless of allegiance', function() {
      const c = { ...character, allegiance: 'enemy' };
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(c, gameSlug, 'pc'));
      expect(html).not.toContain('border-success');
      expect(html).not.toContain('border-danger');
      expect(html).not.toContain('border-secondary');
    });

    it('does not render an InfoBar, ActionBar, or upload button', function() {
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(character, gameSlug, 'npc'));
      expect(html).not.toContain('info-overlay');
      expect(html).not.toContain('actions-overlay');
      expect(html).not.toContain('<button');
    });

    it('does not render a card body or the character name as visible text', function() {
      const html = renderToStaticMarkup(CharacterPreviewCardHelper.render(character, gameSlug, 'pc'));
      expect(html).not.toContain('card-body');
      expect(html).not.toContain('>Aragorn<');
    });

    it('feeds the character name to the tooltip content', function() {
      const rendered = CharacterPreviewCardHelper.render(character, gameSlug, 'pc');
      const tooltip = rendered.props.children;

      expect(tooltip.props.content).toBe('Aragorn');
    });
  });
});
