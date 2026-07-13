import { renderToStaticMarkup } from 'react-dom/server';
import PcCharacterEditHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/PcCharacterEditHelper.jsx';
import NpcCharacterEditHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/NpcCharacterEditHelper.jsx';
import { buildLink } from '../../../../../../../support/factories.js';

const KINDS = [
  {
    label: 'PcCharacterEditHelper',
    Helper: PcCharacterEditHelper,
    idPrefix: 'pc',
    name: 'Aragorn',
    role: 'Ranger',
    description: 'The future king of Gondor.',
  },
  {
    label: 'NpcCharacterEditHelper',
    Helper: NpcCharacterEditHelper,
    idPrefix: 'npc',
    name: 'Goblin King',
    role: 'Brute',
    description: 'Ruler of the cave.',
  },
];

KINDS.forEach(({ label, Helper, idPrefix, name, role, description }) => {
  describe(label, function() {
    const buildHandlers = () => ({
      onSubmit: jasmine.createSpy('onSubmit'),
      onNameChange: jasmine.createSpy('onNameChange'),
      onRoleChange: jasmine.createSpy('onRoleChange'),
      onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
      onPrivateDescriptionChange: jasmine.createSpy('onPrivateDescriptionChange'),
    });
    const buildState = (overrides = {}) => ({
      name,
      profile_photo_path: null,
      links: [],
      role,
      description,
      privateDescription: 'Secret DM notes.',
      status: 'idle',
      fieldErrors: {},
      ...overrides,
    });

    describe('.render', function() {
      it('renders all expected fields seeded with the current state', function() {
        const html = renderToStaticMarkup(Helper.render(buildState(), buildHandlers()));

        expect(html).toContain(`id="${idPrefix}-edit-name"`);
        expect(html).toContain(`id="${idPrefix}-edit-role"`);
        expect(html).toContain(`id="${idPrefix}-edit-description"`);
        expect(html).toContain(`id="${idPrefix}-edit-private-description"`);
        expect(html).toContain(`value="${name}"`);
        expect(html).toContain(`value="${role}"`);
        expect(html).toContain('Secret DM notes.');
      });

      it('renders an avatar preview reflecting the loaded profile_photo_path', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            buildState({ profile_photo_path: 'http://example.com/avatar.png' }),
            buildHandlers()
          )
        );

        expect(html).toContain('http://example.com/avatar.png');
      });

      it('renders the default avatar when profile_photo_path is null', function() {
        const html = renderToStaticMarkup(Helper.render(buildState(), buildHandlers()));

        expect(html).toContain('default_character.png');
      });

      it('renders per-field errors', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            buildState({ fieldErrors: { role: ['must not be blank'] } }),
            buildHandlers()
          )
        );

        expect(html).toContain('must not be blank');
        expect(html).toContain('alert-danger');
      });

      it('renders no field errors when none are present', function() {
        const html = renderToStaticMarkup(Helper.render(buildState(), buildHandlers()));

        expect(html).not.toContain('alert-danger');
      });

      it('renders a general error alert when status is error', function() {
        const html = renderToStaticMarkup(
          Helper.render(buildState({ status: 'error' }), buildHandlers())
        );

        expect(html).toContain('Failed to save character. Please try again.');
      });

      it('disables submit while submitting', function() {
        const html = renderToStaticMarkup(
          Helper.render(buildState({ status: 'submitting' }), buildHandlers())
        );

        expect(html).toContain('disabled=""');
      });

      it('renders the character links as a read-only LinkList', function() {
        const html = renderToStaticMarkup(
          Helper.render(
            buildState({ links: [buildLink({ text: 'Wiki', url: 'https://example.com/wiki' })] }),
            buildHandlers()
          )
        );

        expect(html).toContain('href="https://example.com/wiki"');
        expect(html).toContain('Wiki');
      });
    });

    describe('.renderLoading', function() {
      it('renders a loading message', function() {
        expect(renderToStaticMarkup(Helper.renderLoading())).toContain('Loading character');
      });
    });
  });
});
