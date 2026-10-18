import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokens from '../../../../../../../assets/js/components/resources/account/pages/ApiTokens.jsx';
import ApiTokensHelper from '../../../../../../../assets/js/components/resources/account/pages/helpers/ApiTokensHelper.jsx';
import ApiTokensController from '../../../../../../../assets/js/components/resources/account/pages/controllers/ApiTokensController.js';
import { stubBuildEffect } from '../../../../../../support/controllerStubs.js';

describe('ApiTokens', function() {
  const token = { id: 1, name: 'CI' };
  let state;
  let handlers;

  beforeEach(function() {
    stubBuildEffect(ApiTokensController);
    spyOn(ApiTokensHelper, 'render').and.callFake((s, h) => {
      state = s;
      handlers = h;
      return React.createElement('div');
    });
    renderToStaticMarkup(React.createElement(ApiTokens));
  });

  it('starts loading, with no options', function() {
    expect(state).toEqual({
      tokens: [],
      loading: true,
      error: false,
      options: null,
      optionsError: false,
      notice: null,
      renaming: null,
      revokeTarget: null,
      revoking: false,
      showCreate: false,
    });
  });

  it('refreshes on retry', function() {
    spyOn(ApiTokensController.prototype, 'refresh').and.resolveTo();

    handlers.onRetry();

    expect(ApiTokensController.prototype.refresh).toHaveBeenCalled();
  });

  it('refreshes after a token was created', function() {
    spyOn(ApiTokensController.prototype, 'refresh').and.resolveTo();

    handlers.onCreated();

    expect(ApiTokensController.prototype.refresh).toHaveBeenCalled();
  });

  it('renames through the controller, falling back to the current name', async function() {
    spyOn(ApiTokensController.prototype, 'rename').and.resolveTo({ ok: true, errors: {} });

    await handlers.onRenameSave(token);

    expect(ApiTokensController.prototype.rename).toHaveBeenCalledWith(token, 'CI');
  });

  it('keeps the row in edit mode on a failed rename', async function() {
    spyOn(ApiTokensController.prototype, 'rename').and.resolveTo({ ok: false, errors: { name: ['blank'] } });

    await expectAsync(handlers.onRenameSave(token)).toBeResolved();
  });

  it('revokes the target through the controller', async function() {
    spyOn(ApiTokensController.prototype, 'revoke').and.resolveTo();

    await handlers.onRevokeConfirm();

    expect(ApiTokensController.prototype.revoke).toHaveBeenCalledWith(null);
  });

  it('exposes the remaining handlers', function() {
    expect(() => {
      handlers.onOpenCreate();
      handlers.onCloseCreate();
      handlers.onRenameStart(token);
      handlers.onRenameChange('x');
      handlers.onRenameCancel();
      handlers.onRevoke(token);
      handlers.onRevokeCancel();
    }).not.toThrow();
  });
});
