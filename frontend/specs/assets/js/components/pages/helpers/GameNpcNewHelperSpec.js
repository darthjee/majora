import { renderToStaticMarkup } from 'react-dom/server';
import GameNpcNewHelper from '../../../../../../assets/js/components/pages/helpers/GameNpcNewHelper.jsx';

describe('GameNpcNewHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onRoleChange: jasmine.createSpy('onRoleChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onPrivateDescriptionChange: jasmine.createSpy('onPrivateDescriptionChange'),
    onHiddenChange: jasmine.createSpy('onHiddenChange'),
    onMoneyChange: jasmine.createSpy('onMoneyChange'),
    onAllegianceChange: jasmine.createSpy('onAllegianceChange'),
    onPublicAllegianceChange: jasmine.createSpy('onPublicAllegianceChange'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Goblin King',
    role: 'Villain',
    description: 'A menacing goblin.',
    privateDescription: 'Secretly a coward.',
    hidden: false,
    money: '42',
    allegiance: 'neutral',
    publicAllegiance: 'neutral',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-npc-new-name"');
      expect(html).toContain('id="game-npc-new-role"');
      expect(html).toContain('id="game-npc-new-description"');
      expect(html).toContain('id="game-npc-new-private-description"');
      expect(html).toContain('id="game-npc-new-money"');
      expect(html).toContain('id="game-npc-new-hidden"');
      expect(html).toContain('id="game-npc-new-allegiance"');
      expect(html).toContain('id="game-npc-new-public-allegiance"');
    });

    it('renders the allegiance and public allegiance selects with the current values', function() {
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(buildState({ allegiance: 'ally', publicAllegiance: 'enemy' }), buildHandlers()),
      );
      const allegianceSelectStart = html.indexOf('id="game-npc-new-allegiance"');
      const publicAllegianceSelectStart = html.indexOf('id="game-npc-new-public-allegiance"');

      expect(allegianceSelectStart).toBeGreaterThan(-1);
      expect(publicAllegianceSelectStart).toBeGreaterThan(-1);
      expect(html.indexOf('selected=""', allegianceSelectStart)).toBeGreaterThan(-1);
      expect(html.indexOf('selected=""', publicAllegianceSelectStart)).toBeGreaterThan(-1);
    });

    it('renders the current field values', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('value="Goblin King"');
      expect(html).toContain('value="Villain"');
      expect(html).toContain('value="42"');
    });

    it('renders the hidden checkbox as checked when hidden is true', function() {
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(buildState({ hidden: true }), buildHandlers()),
      );

      expect(html).toContain('checked=""');
    });

    it('renders the submit button', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
      expect(html).toContain('Create NPC');
    });

    it('disables the submit button while submitting', function() {
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(buildState({ status: 'submitting' }), buildHandlers()),
      );

      expect(html).toContain('disabled=""');
    });

    it('does not disable the submit button when status is idle', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('disabled=""');
    });

    it('renders per-field errors when present', function() {
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(
          buildState({ fieldErrors: { name: ['is required'] } }),
          buildHandlers(),
        ),
      );

      expect(html).toContain('is required');
      expect(html).toContain('alert-danger');
    });

    it('renders no field error alerts when none are present', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(buildState({ status: 'error' }), buildHandlers()),
      );

      expect(html).toContain('Failed to create NPC. Please try again.');
      expect(html).toContain('alert');
    });

    it('does not render a general error alert when status is idle', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Failed to create NPC.');
    });
  });
});
