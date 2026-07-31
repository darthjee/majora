import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterMoneyShow, { buildCharacterMoneyField }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterMoneySlot.jsx';

describe('CharacterMoneySlot', function() {
  describe('Show', function() {
    it('renders the money breakdown wired to the edit-money handler when can_edit is true', function() {
      const handlers = { onOpenMoneyModal: jasmine.createSpy('onOpenMoneyModal') };
      const html = renderToStaticMarkup(
        React.createElement(CharacterMoneyShow, {
          money: 100, treasure_value: 0, game_type: 'dnd', can_edit: true, handlers,
        }),
      );

      expect(html).toContain('Edit');
    });

    it('renders the Edit link when is_player is true (not can_edit)', function() {
      const handlers = { onOpenMoneyModal: jasmine.createSpy('onOpenMoneyModal') };
      const html = renderToStaticMarkup(
        React.createElement(CharacterMoneyShow, {
          money: 100, treasure_value: 0, game_type: 'dnd', can_edit: false, is_player: true, handlers,
        }),
      );

      expect(html).toContain('Edit');
    });

    it('renders the Edit link when is_staff is true (not can_edit or is_player)', function() {
      const handlers = { onOpenMoneyModal: jasmine.createSpy('onOpenMoneyModal') };
      const html = renderToStaticMarkup(
        React.createElement(CharacterMoneyShow, {
          money: 100, treasure_value: 0, game_type: 'dnd', can_edit: false, is_staff: true, handlers,
        }),
      );

      expect(html).toContain('Edit');
    });

    it('does not render the Edit link when none of can_edit/is_player/is_staff are true', function() {
      const handlers = { onOpenMoneyModal: jasmine.createSpy('onOpenMoneyModal') };
      const html = renderToStaticMarkup(
        React.createElement(CharacterMoneyShow, {
          money: 100, treasure_value: 0, game_type: 'dnd', can_edit: false, handlers,
        }),
      );

      expect(html).not.toContain('Edit');
    });
  });

  describe('buildCharacterMoneyField', function() {
    const variants = {
      edit: { label: 'npc_edit_page.money_label', button: 'npc_edit_page.edit_money_button' },
      new: { label: 'game_npc_new_page.money_label', button: 'game_npc_new_page.edit_money_button' },
    };

    it('renders nothing when the current editor is not a full editor', function() {
      const MoneyField = buildCharacterMoneyField(variants);
      const html = renderToStaticMarkup(
        React.createElement(MoneyField, {
          mode: 'edit', isFullEditor: false, money: '100', gameType: 'dnd', handlers: {},
        }),
      );

      expect(html).toBe('');
    });

    it('renders the mode-scoped label/button for a full editor', function() {
      const MoneyField = buildCharacterMoneyField(variants);
      const html = renderToStaticMarkup(
        React.createElement(MoneyField, {
          mode: 'new', isFullEditor: true, money: '100', gameType: 'dnd', handlers: {},
        }),
      );

      expect(html).toContain('Money');
      expect(html).toContain('Edit money');
    });

    it('defaults treasureValue to 0', function() {
      const MoneyField = buildCharacterMoneyField(variants);

      expect(() => renderToStaticMarkup(
        React.createElement(MoneyField, {
          mode: 'edit', isFullEditor: true, money: '0', gameType: 'dnd', handlers: {},
        }),
      )).not.toThrow();
    });

    it('renders field-level errors when present', function() {
      const MoneyField = buildCharacterMoneyField(variants);
      const html = renderToStaticMarkup(
        React.createElement(MoneyField, {
          mode: 'edit',
          isFullEditor: true,
          money: '-5',
          gameType: 'dnd',
          fieldErrors: { money: ['must be greater than or equal to 0'] },
          handlers: {},
        }),
      );

      expect(html).toContain('must be greater than or equal to 0');
    });
  });
});
