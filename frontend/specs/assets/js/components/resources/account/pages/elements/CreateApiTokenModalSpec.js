import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CreateApiTokenModal from '../../../../../../../../assets/js/components/resources/account/pages/elements/CreateApiTokenModal.jsx';
import CreateApiTokenModalHelper from '../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/CreateApiTokenModalHelper.jsx';
import CreateApiTokenModalController from '../../../../../../../../assets/js/components/resources/account/pages/elements/controllers/CreateApiTokenModalController.js';

describe('CreateApiTokenModal', function() {
  const options = { scopes: ['npcs:read'], games: [], all_games: false };
  let state;
  let handlers;
  let onCancel;
  let onCreated;

  beforeEach(function() {
    onCancel = jasmine.createSpy('onCancel');
    onCreated = jasmine.createSpy('onCreated');
    spyOn(CreateApiTokenModalHelper, 'render').and.callFake((s, h) => {
      state = s;
      handlers = h;
      return React.createElement('div');
    });
    renderToStaticMarkup(React.createElement(CreateApiTokenModal, {
      show: true, options, onCancel, onCreated,
    }));
  });

  it('renders the empty form view with Create disabled', function() {
    expect(state).toEqual({
      show: true,
      form: CreateApiTokenModalController.emptyForm(),
      fieldErrors: {},
      status: 'idle',
      secret: null,
      copyStatus: null,
      options,
      canSubmit: false,
    });
  });

  it('passes onCancel through', function() {
    expect(handlers.onCancel).toBe(onCancel);
  });

  it('submits the current form through the controller', function() {
    spyOn(CreateApiTokenModalController.prototype, 'submit').and.resolveTo();
    const event = {};

    handlers.onSubmit(event);

    expect(CreateApiTokenModalController.prototype.submit).toHaveBeenCalledWith(event, state.form);
  });

  it('calls onCreated on Done', function() {
    handlers.onDone();

    expect(onCreated).toHaveBeenCalled();
  });

  it('exposes the field change handlers', function() {
    expect(() => {
      handlers.onNameChange({ target: { value: 'x' } });
      handlers.onScopesChange(['npcs:read']);
      handlers.onGamesChange([]);
      handlers.onExpiryChange({ choice: 'never', customDate: '' });
    }).not.toThrow();
  });
});
