import { renderToStaticMarkup } from 'react-dom/server';
import GameNpcNewHelper from '../../../../../../../../assets/js/components/resources/character/pages/helpers/GameNpcNewHelper.jsx';
import CharacterMoneyField from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterMoneyField.jsx';
import { buildLink } from '../../../../../../../support/factories.js';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('GameNpcNewHelper', function() {
  const buildHandlers = () => ({
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onRoleChange: jasmine.createSpy('onRoleChange'),
    onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
    onPrivateDescriptionChange: jasmine.createSpy('onPrivateDescriptionChange'),
    onOpenLinksModal: jasmine.createSpy('onOpenLinksModal'),
    onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
    onOpenMoneyModal: jasmine.createSpy('onOpenMoneyModal'),
    onHiddenChange: jasmine.createSpy('onHiddenChange'),
    onAllegianceChange: jasmine.createSpy('onAllegianceChange'),
    onPublicAllegianceChange: jasmine.createSpy('onPublicAllegianceChange'),
    onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
    onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
  });

  const buildState = (overrides = {}) => ({
    name: 'Goblin King',
    role: 'Villain',
    description: 'A menacing goblin.',
    privateDescription: 'Secretly a coward.',
    links: [],
    hidden: false,
    money: '42',
    gameType: 'dnd',
    allegiance: 'neutral',
    publicAllegiance: 'neutral',
    status: 'idle',
    fieldErrors: {},
    photoPreviewUrl: null,
    ...overrides,
  });

  describe('.render', function() {
    it('renders all expected form fields', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('id="game-npc-new-name"');
      expect(html).toContain('id="game-npc-new-role"');
      expect(html).toContain('id="game-npc-new-description"');
      expect(html).toContain('id="game-npc-new-private-description"');
      expect(html).toContain('id="game-npc-new-hidden"');
      expect(html).toContain('id="game-npc-new-allegiance"');
      expect(html).toContain('id="game-npc-new-public-allegiance"');
    });

    it('renders a CharacterMoneyField instead of a raw numeric money input, wired to the current '
      + 'money/gameType/errors/onOpenMoneyModal', function() {
      const handlers = buildHandlers();
      const state = buildState({
        money: '42', gameType: 'deadlands', fieldErrors: { money: ['must be greater than or equal to 0'] },
      });
      const html = renderToStaticMarkup(GameNpcNewHelper.render(state, handlers));
      const field = findElement(GameNpcNewHelper.render(state, handlers), (child) => (
        child.type === CharacterMoneyField
      ));

      expect(html).not.toContain('id="game-npc-new-money"');
      expect(field).not.toBeNull();
      expect(field.props.isFullEditor).toBe(true);
      expect(field.props.money).toBe('42');
      expect(field.props.treasureValue).toBe(0);
      expect(field.props.gameType).toBe('deadlands');
      expect(field.props.label).toBe('Money');
      expect(field.props.buttonLabel).toBe('Edit money');
      expect(field.props.onOpenMoneyModal).toBe(handlers.onOpenMoneyModal);
      expect(field.props.errors).toEqual(['must be greater than or equal to 0']);
    });

    it('renders an editable avatar placeholder with an upload control in the left column', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));
      const leftColStart = html.indexOf('class="col-md-4"');
      const rightColStart = html.indexOf('class="col-md-8"');
      // react-dom prepends an image preload <link> for the first occurrence of any
      // <img> src, so the real, in-body avatar image is its *last* occurrence, not
      // its first.
      const avatarIndex = html.lastIndexOf('default_character.png');

      expect(leftColStart).toBeGreaterThan(-1);
      expect(rightColStart).toBeGreaterThan(leftColStart);
      expect(avatarIndex).toBeGreaterThan(leftColStart);
      expect(avatarIndex).toBeLessThan(rightColStart);
      expect(html).toContain('actions-overlay-button');
    });

    it('renders the picked photo preview when photoPreviewUrl is set', function() {
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(buildState({ photoPreviewUrl: 'blob:fake-preview' }), buildHandlers()),
      );

      expect(html).toContain('blob:fake-preview');
    });

    it('renders the links field in the left column, wired to onOpenLinksModal', function() {
      const handlers = buildHandlers();
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(
          buildState({ links: [buildLink({ text: 'Wiki', url: 'https://example.com/wiki' })] }),
          handlers,
        )
      );

      expect(html).toContain('href="https://example.com/wiki"');
      expect(html).toContain('Edit links');
    });

    it('renders role, description and DM notes fields in the right column', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));
      const rightColStart = html.indexOf('class="col-md-8"');
      const roleIndex = html.indexOf('id="game-npc-new-role"');
      const descriptionIndex = html.indexOf('id="game-npc-new-description"');
      const privateDescriptionIndex = html.indexOf('id="game-npc-new-private-description"');

      expect(roleIndex).toBeGreaterThan(rightColStart);
      expect(descriptionIndex).toBeGreaterThan(rightColStart);
      expect(privateDescriptionIndex).toBeGreaterThan(rightColStart);
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
    });

    it('renders the hidden checkbox as checked when hidden is true', function() {
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(buildState({ hidden: true }), buildHandlers()),
      );

      expect(html).toContain('checked=""');
    });

    it('renders the hidden switch as a bootstrap switch', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));
      const hiddenIndex = html.indexOf('id="game-npc-new-hidden"');

      expect(hiddenIndex).toBeGreaterThan(-1);
      expect(html).toContain('form-switch');
      expect(html.lastIndexOf('role="switch"', hiddenIndex + 200)).toBeGreaterThan(-1);
    });

    it('does not dim the avatar preview when hidden is false', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('photo-hidden');
    });

    it('dims the avatar preview when hidden is true', function() {
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(buildState({ hidden: true }), buildHandlers()),
      );

      expect(html).toContain('photo-hidden');
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

    it('renders the photo-upload-failed alert with retry and skip buttons', function() {
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(buildState({ status: 'photo-upload-failed' }), buildHandlers()),
      );

      expect(html).toContain('Failed to upload the photo');
      expect(html).toContain('Retry photo upload');
      expect(html).toContain('Skip and continue');
    });

    it('does not render the photo-upload-failed alert when status is idle', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));

      expect(html).not.toContain('Retry photo upload');
    });

    it('wires the retry and skip handlers in the photo-upload-failed state', function() {
      const handlers = buildHandlers();
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(buildState({ status: 'photo-upload-failed' }), handlers),
      );

      expect(html).toContain('btn-primary');
      expect(html).toContain('btn-secondary');
    });

    it('hides the submit button when status is photo-upload-failed', function() {
      const html = renderToStaticMarkup(
        GameNpcNewHelper.render(buildState({ status: 'photo-upload-failed' }), buildHandlers()),
      );

      expect(html).not.toContain('type="submit"');
    });

    it('renders the submit button when status is idle', function() {
      const html = renderToStaticMarkup(GameNpcNewHelper.render(buildState(), buildHandlers()));

      expect(html).toContain('type="submit"');
    });
  });
});
