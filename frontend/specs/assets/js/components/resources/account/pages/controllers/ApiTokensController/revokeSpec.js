import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import {
  buildSetters, buildController, response, stubEnsure,
} from './support.js';

describe('ApiTokensController#revoke', function() {
  const token = { id: 7, name: 'CI' };
  let setters;
  let controller;

  beforeEach(function() {
    setters = buildSetters();
    controller = buildController(setters);
    spyOn(RequestStore, 'purge');
    stubEnsure(RequestStore);
  });

  it('deletes the token and refreshes on a 204', async function() {
    spyOn(RequestStore, 'mutate').and.resolveTo(response(204));

    await controller.revoke(token);

    expect(RequestStore.mutate).toHaveBeenCalledWith({
      componentName: 'ApiTokensController',
      resource: 'apiToken',
      method: 'DELETE',
      quantityType: 'single',
      params: { id: 7 },
      body: undefined,
    });
    expect(setters.setNotice).toHaveBeenCalledOnceWith(null);
    expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'apiToken' });
    expect(RequestStore.ensure).toHaveBeenCalled();
  });

  it('shows token_gone and refreshes on a 404', async function() {
    spyOn(RequestStore, 'mutate').and.resolveTo(response(404));

    await controller.revoke(token);

    expect(setters.setNotice).toHaveBeenCalledWith('token_gone');
    expect(RequestStore.purge).toHaveBeenCalled();
  });

  it('shows action_error on a failure, without refreshing', async function() {
    spyOn(RequestStore, 'mutate').and.resolveTo(response(500));

    await controller.revoke(token);

    expect(setters.setNotice).toHaveBeenCalledWith('action_error');
    expect(RequestStore.purge).not.toHaveBeenCalled();
  });

  it('shows action_error on a network error', async function() {
    spyOn(RequestStore, 'mutate').and.rejectWith(new Error('network'));

    await controller.revoke(token);

    expect(setters.setNotice).toHaveBeenCalledWith('action_error');
  });
});
