import Modal from 'react-bootstrap/cjs/Modal.js';
import CreateApiTokenModalHelper from '../../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/CreateApiTokenModalHelper.jsx';
import CreateApiTokenModalController from '../../../../../../../../../assets/js/components/resources/account/pages/elements/controllers/CreateApiTokenModalController.js';
import ApiTokenSecretView from '../../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenSecretView.jsx';
import ApiTokenScopePicker from '../../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenScopePicker.jsx';
import ApiTokenGamesPicker from '../../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenGamesPicker.jsx';

const findAll = (node, matcher, found = []) => {
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, matcher, found));
  } else if (node && typeof node === 'object') {
    if (matcher(node)) found.push(node);
    findAll(node.props?.children, matcher, found);
  }
  return found;
};

describe('CreateApiTokenModalHelper', function() {
  const options = { scopes: ['npcs:read'], games: [{ slug: 'a', name: 'A' }], all_games: false };
  const handlers = {
    onCancel: jasmine.createSpy('onCancel'),
    onSubmit: jasmine.createSpy('onSubmit'),
    onNameChange: jasmine.createSpy('onNameChange'),
    onScopesChange: jasmine.createSpy('onScopesChange'),
    onGamesChange: jasmine.createSpy('onGamesChange'),
    onExpiryChange: jasmine.createSpy('onExpiryChange'),
    onCopy: jasmine.createSpy('onCopy'),
    onDone: jasmine.createSpy('onDone'),
  };
  const build = (state) => CreateApiTokenModalHelper.render({
    show: true,
    form: CreateApiTokenModalController.emptyForm(),
    fieldErrors: {},
    status: 'idle',
    secret: null,
    copyStatus: null,
    options,
    canSubmit: false,
    ...state,
  }, handlers);
  const submitButton = (element) => findAll(element, (node) => node.props?.type === 'submit')[0];

  describe('form view', function() {
    it('is dismissable through onCancel', function() {
      const element = build();

      expect(element.type).toBe(Modal);
      expect(element.props.onHide).toBe(handlers.onCancel);
      expect(element.props.backdrop).toBeUndefined();
    });

    it('disables Create when canSubmit is false', function() {
      expect(submitButton(build()).props.disabled).toBeTrue();
      expect(submitButton(build({ canSubmit: true })).props.disabled).toBeFalse();
    });

    it('limits the name to 100 characters and renders its errors', function() {
      const element = build({ fieldErrors: { name: ['max_length'] } });
      const input = findAll(element, (node) => node.props?.id === 'api-token-name')[0];
      const errors = findAll(element, (node) => Array.isArray(node.props?.errors) && node.props.errors.includes('max_length'));

      expect(input.props.maxLength).toBe(100);
      expect(errors.length).toBe(1);
    });

    it('passes the field errors and options to the pickers', function() {
      const fieldErrors = { scopes: ['empty'], games: ['max_length'] };
      const element = build({ fieldErrors });
      const scopePicker = findAll(element, (node) => node.type === ApiTokenScopePicker)[0];
      const gamesPicker = findAll(element, (node) => node.type === ApiTokenGamesPicker)[0];

      expect(scopePicker.props.errors).toBe(fieldErrors);
      expect(scopePicker.props.scopes).toEqual(options.scopes);
      expect(gamesPicker.props.errors).toBe(fieldErrors);
      expect(gamesPicker.props.options).toBe(options);
    });

    it('falls back to empty options when they failed to load', function() {
      const scopePicker = findAll(build({ options: null }), (node) => node.type === ApiTokenScopePicker)[0];

      expect(scopePicker.props.scopes).toEqual([]);
    });

    it('shows the generic error only on the error status', function() {
      const matcher = (node) => node.props?.['data-testid'] === 'api-token-create-error';

      expect(findAll(build({ status: 'error' }), matcher).length).toBe(1);
      expect(findAll(build(), matcher).length).toBe(0);
    });
  });

  describe('secret view', function() {
    const secret = { token: 'mjr_secret', name: 'CI' };

    it('is a static modal that only Done closes', function() {
      const element = build({ secret });

      expect(element.props.backdrop).toBe('static');
      expect(element.props.keyboard).toBeFalse();
      expect(element.props.onHide).not.toBe(handlers.onCancel);
    });

    it('renders the secret view with the token and handlers', function() {
      const view = findAll(build({ secret, copyStatus: 'copied' }), (node) => node.type === ApiTokenSecretView)[0];

      expect(view.props).toEqual({
        token: 'mjr_secret', copyStatus: 'copied', onCopy: handlers.onCopy, onDone: handlers.onDone,
      });
    });
  });
});
