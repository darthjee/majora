import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import GameCharactersHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/GameCharactersHelper.jsx';
import CharacterCard from '../../../../../../../../assets/js/components/elements/CharacterCard.jsx';
import { buildCharacter } from '../../../../../../../support/factories.js';

const findElements = (node, matcher, found = []) => {
  if (!node) {
    return found;
  }

  if (Array.isArray(node)) {
    node.forEach((child) => findElements(child, matcher, found));
    return found;
  }

  if (typeof node !== 'object') {
    return found;
  }

  if (matcher(node)) {
    found.push(node);
  }

  findElements(node.props?.children, matcher, found);
  return found;
};

describe('GameCharactersHelper', function() {
  const characters = [
    buildCharacter({ id: 1, name: 'Aragorn' }),
    buildCharacter({ id: 2, name: 'Legolas' }),
  ];
  const pagination = { page: 1, pages: 3, perPage: 10 };

  describe('.render', function() {
    it('renders the page title', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).toContain('Player Characters');
    });

    it('renders each character name', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).toContain('Aragorn');
      expect(html).toContain('Legolas');
    });

    it('renders character links using gameSlug and characterType', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).toContain('href="#/games/eq/pcs/1"');
      expect(html).toContain('href="#/games/eq/pcs/2"');
    });

    it('renders npc character links when characterType is npc', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/npcs', 'eq', 'Non-Player Characters', 'npc', '#/games/eq',
        )
      );
      expect(html).toContain('href="#/games/eq/npcs/1"');
      expect(html).toContain('href="#/games/eq/npcs/2"');
    });

    it('renders pagination', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).toContain('pagination');
    });

    it('renders a back button to the parent game page', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).toContain('href="#/games/eq"');
    });

    it('does not render the new NPC button when canEdit is omitted', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).not.toContain('New NPC');
    });

    it('does not render the new NPC button when canEdit is false', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/npcs', 'eq', 'Non-Player Characters', 'npc', '#/games/eq',
          false, '#/games/eq/npcs/new',
        )
      );
      expect(html).not.toContain('New NPC');
    });

    it('renders the new NPC button when canEdit is true', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/npcs', 'eq', 'Non-Player Characters', 'npc', '#/games/eq',
          true, '#/games/eq/npcs/new',
        )
      );
      expect(html).toContain('New NPC');
      expect(html).toContain('href="#/games/eq/npcs/new"');
    });

    it('forwards canEdit and click handlers to CharacterCard for npc characterType', function() {
      const onUploadClick = jasmine.createSpy('onUploadClick');
      const onSlainClick = jasmine.createSpy('onSlainClick');
      const onPublicSlainClick = jasmine.createSpy('onPublicSlainClick');
      const element = GameCharactersHelper.render(
        characters, pagination, '#/games/eq/npcs', 'eq', 'Non-Player Characters', 'npc', '#/games/eq',
        true, '#/games/eq/npcs/new', onUploadClick, onSlainClick, onPublicSlainClick,
      );
      const cards = findElements(element, (child) => child.type === CharacterCard);

      expect(cards.length).toBe(2);
      cards.forEach((card) => {
        expect(card.props.canEdit).toBe(true);
        expect(card.props.onUploadClick).toBe(onUploadClick);
        expect(card.props.onSlainClick).toBe(onSlainClick);
        expect(card.props.onPublicSlainClick).toBe(onPublicSlainClick);
      });
    });

    it('forwards isPlayer and onPlayerSlainClick to CharacterCard for npc characterType', function() {
      const onPlayerSlainClick = jasmine.createSpy('onPlayerSlainClick');
      const element = GameCharactersHelper.render(
        characters, pagination, '#/games/eq/npcs', 'eq', 'Non-Player Characters', 'npc', '#/games/eq',
        false, '#/games/eq/npcs/new', undefined, undefined, undefined, {}, null,
        true, onPlayerSlainClick,
      );
      const cards = findElements(element, (child) => child.type === CharacterCard);

      expect(cards.length).toBe(2);
      cards.forEach((card) => {
        expect(card.props.isPlayer).toBe(true);
        expect(card.props.onPlayerSlainClick).toBe(onPlayerSlainClick);
      });
    });

    it('does not forward isPlayer or onPlayerSlainClick to CharacterCard for pc characterType', function() {
      const onPlayerSlainClick = jasmine.createSpy('onPlayerSlainClick');
      const element = GameCharactersHelper.render(
        characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        false, '', undefined, undefined, undefined, {}, null, true, onPlayerSlainClick,
      );
      const cards = findElements(element, (child) => child.type === CharacterCard);

      expect(cards.length).toBe(2);
      cards.forEach((card) => {
        expect(card.props.isPlayer).toBeUndefined();
        expect(card.props.onPlayerSlainClick).toBeUndefined();
      });
    });

    it('forwards extraParams to the Pagination links when provided', function() {
      const paginated = { page: 1, pages: 3, perPage: 10 };
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, paginated, '#/games/eq/npcs', 'eq', 'Non-Player Characters', 'npc', '#/games/eq',
          false, '', undefined, undefined, undefined, { slain: 'true', name: 'gob' },
        )
      );
      expect(html).toContain('slain=true');
      expect(html).toContain('name=gob');
    });

    it('renders the filters node between the title and the character grid when provided', function() {
      const filtersMarker = React.createElement('div', { 'data-testid': 'npc-filters-marker' }, 'filters');
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/npcs', 'eq', 'Non-Player Characters', 'npc', '#/games/eq',
          false, '', undefined, undefined, undefined, {}, filtersMarker,
        )
      );
      expect(html).toContain('data-testid="npc-filters-marker"');
    });

    it('renders no filters node when omitted', function() {
      const html = renderToStaticMarkup(
        GameCharactersHelper.render(
          characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        )
      );
      expect(html).not.toContain('npc-filters-marker');
    });

    it('does not forward canEdit or click handlers to CharacterCard for pc characterType', function() {
      const element = GameCharactersHelper.render(
        characters, pagination, '#/games/eq/pcs', 'eq', 'Player Characters', 'pc', '#/games/eq',
        true,
      );
      const cards = findElements(element, (child) => child.type === CharacterCard);

      expect(cards.length).toBe(2);
      cards.forEach((card) => {
        expect(card.props.canEdit).toBeUndefined();
        expect(card.props.onUploadClick).toBeUndefined();
        expect(card.props.onSlainClick).toBeUndefined();
        expect(card.props.onPublicSlainClick).toBeUndefined();
      });
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(GameCharactersHelper.renderLoading())).toContain('Loading');
    });
  });

  describe('.renderError', function() {
    it('renders the error in an alert', function() {
      const html = renderToStaticMarkup(GameCharactersHelper.renderError('Oops'));
      expect(html).toContain('Oops');
      expect(html).toContain('alert');
    });
  });
});
