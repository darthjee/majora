import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterEditHelper from '../../../../../../assets/js/components/pages/helpers/PcCharacterEditHelper.jsx';

describe('PcCharacterEditHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onRoleChange: jasmine.createSpy('onRoleChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onPrivateDescriptionChange: jasmine.createSpy('onPrivateDescriptionChange'),
  });
  const buildState = (overrides = {}) => ({
    name: 'Aragorn',
    profile_photo_path: null,
    links: [],
    role: 'Ranger',
    description: 'The future king of Gondor.',
    privateDescription: 'Secret DM notes.',
    status: 'idle',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected fields seeded with the current state', function() {
      const html = renderToStaticMarkup(PcCharacterEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="pc-edit-name"');
      expect(html).toContain('id="pc-edit-role"');
      expect(html).toContain('id="pc-edit-description"');
      expect(html).toContain('id="pc-edit-private-description"');
      expect(html).toContain('value="Aragorn"');
      expect(html).toContain('value="Ranger"');
      expect(html).toContain('Secret DM notes.');
    });

    it('renders an avatar preview reflecting the loaded profile_photo_path', function() {
      const html = renderToStaticMarkup(
        PcCharacterEditHelper.render(
          buildState({ profile_photo_path: 'http://example.com/avatar.png' }),
          buildHandlers()
        )
      );

      expect(html).toContain('http://example.com/avatar.png');
    });

    it('renders the default avatar when profile_photo_path is null', function() {
      const html = renderToStaticMarkup(PcCharacterEditHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('default_character.png');
    });

    it('renders per-field errors', function() {
      const html = renderToStaticMarkup(
        PcCharacterEditHelper.render(
          buildState({ fieldErrors: { role: ['must not be blank'] } }),
          buildHandlers()
        )
      );

      expect(html).toContain('must not be blank');
      expect(html).toContain('alert-danger');
    });

    it('renders no field errors when none are present', function() {
      const html = renderToStaticMarkup(PcCharacterEditHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('alert-danger');
    });

    it('renders a general error alert when status is error', function() {
      const html = renderToStaticMarkup(
        PcCharacterEditHelper.render(buildState({ status: 'error' }), buildHandlers())
      );

      expect(html).toContain('Failed to save character. Please try again.');
    });

    it('disables submit while submitting', function() {
      const html = renderToStaticMarkup(
        PcCharacterEditHelper.render(buildState({ status: 'submitting' }), buildHandlers())
      );

      expect(html).toContain('disabled=""');
    });

    it('renders the character links as a read-only LinkList', function() {
      const html = renderToStaticMarkup(
        PcCharacterEditHelper.render(
          buildState({ links: [{ text: 'Wiki', url: 'https://example.com/wiki' }] }),
          buildHandlers()
        )
      );

      expect(html).toContain('href="https://example.com/wiki"');
      expect(html).toContain('Wiki');
    });
  });

  describe('.renderLoading', function() {
    it('renders a loading message', function() {
      expect(renderToStaticMarkup(PcCharacterEditHelper.renderLoading())).toContain('Loading character');
    });
  });
});
