import { renderToStaticMarkup } from 'react-dom/server';
import NpcCharacterEditHelper from '../../../../../../assets/js/components/pages/helpers/NpcCharacterEditHelper.jsx';

describe('NpcCharacterEditHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onAvatarUrlChange: jasmine.createSpy('onAvatarUrlChange'),
    onCharacterClassChange: jasmine.createSpy('onCharacterClassChange'),
    onLevelChange: jasmine.createSpy('onLevelChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onPrivateDescriptionChange: jasmine.createSpy('onPrivateDescriptionChange'),
  });
  const buildState = (overrides = {}) => ({
    name: 'Goblin King',
    avatar_url: '',
    character_class: 'Brute',
    level: '5',
    description: 'Ruler of the cave.',
    privateDescription: 'Secret DM notes.',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected fields seeded with the current state', function() {
      const html = renderToStaticMarkup(NpcCharacterEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="npc-edit-name"');
      expect(html).toContain('id="npc-edit-avatar-url"');
      expect(html).toContain('id="npc-edit-character-class"');
      expect(html).toContain('id="npc-edit-level"');
      expect(html).toContain('id="npc-edit-description"');
      expect(html).toContain('id="npc-edit-private-description"');
      expect(html).toContain('value="Goblin King"');
      expect(html).toContain('value="Brute"');
      expect(html).toContain('Secret DM notes.');
    });

    it('renders a live avatar preview reflecting the current avatar_url', function() {
      const html = renderToStaticMarkup(
        NpcCharacterEditHelper.render(
          buildState({ avatar_url: 'http://example.com/avatar.png' }),
          buildHandlers()
        )
      );

      expect(html).toContain('http://example.com/avatar.png');
    });

    it('renders the default avatar when avatar_url is empty', function() {
      const html = renderToStaticMarkup(NpcCharacterEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('default_character.png');
    });

    it('renders per-field errors', function() {
      const html = renderToStaticMarkup(
        NpcCharacterEditHelper.render(
          buildState({ fieldErrors: { level: ['must be a positive integer'] } }),
          buildHandlers()
        )
      );

      expect(html).toContain('must be a positive integer');
      expect(html).toContain('alert-danger');
    });

    it('renders no field errors when none are present', function() {
      const html = renderToStaticMarkup(NpcCharacterEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        NpcCharacterEditHelper.render(buildState({ status: 'error' }), buildHandlers())
      );

      expect(html).toContain('Failed to save character. Please try again.');
    });

    it('disables submit while submitting', function() {
      const html = renderToStaticMarkup(
        NpcCharacterEditHelper.render(buildState({ status: 'submitting' }), buildHandlers())
      );

      expect(html).toContain('disabled=""');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(NpcCharacterEditHelper.renderLoading())).toContain('Loading character');
    });
  });
});
