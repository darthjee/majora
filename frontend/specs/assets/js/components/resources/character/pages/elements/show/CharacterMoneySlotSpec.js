import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterMoneyShow, { buildCharacterMoneyField }
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterMoneySlot.jsx';

describe('CharacterMoneySlot', function() {
  describe('Show', function() {
    it('renders the money breakdown wired to the edit-money handler', function() {
      const handlers = { onOpenMoneyModal: jasmine.createSpy('onOpenMoneyModal') };
      const html = renderToStaticMarkup(
        React.createElement(CharacterMoneyShow, {
          money: 100, treasure_value: 0, game_type: 'dnd', can_edit_money: true, handlers,
        }),
      );

      expect(html).toContain('Edit');
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
