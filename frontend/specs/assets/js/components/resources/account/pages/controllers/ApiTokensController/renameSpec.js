import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import {
  buildSetters, buildController, response, stubEnsure,
} from './support.js';

describe('ApiTokensController#rename', function() {
  const token = { id: 7, name: 'CI' };
  let setters;
  let controller;

  beforeEach(function() {
    setters = buildSetters();
    controller = buildController(setters);
    spyOn(RequestStore, 'purge');
    stubEnsure(RequestStore);
  });

  it('sends nothing when the trimmed name is unchanged', async function() {
    spyOn(RequestStore, 'mutate');

    const result = await controller.rename(token, '  CI ');

    expect(RequestStore.mutate).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true, errors: {} });
  });

  it('patches the trimmed name and refreshes on success', async function() {
    spyOn(RequestStore, 'mutate').and.resolveTo(response(200, { id: 7, name: 'Bot' }));

    const result = await controller.rename(token, ' Bot ');

    expect(RequestStore.mutate).toHaveBeenCalledWith({
      componentName: 'ApiTokensController',
      resource: 'apiToken',
      method: 'PATCH',
      quantityType: 'single',
      params: { id: 7 },
      body: { name: 'Bot' },
    });
    expect(RequestStore.purge).toHaveBeenCalledWith({ resource: 'apiToken' });
    expect(RequestStore.ensure).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, errors: {} });
  });

  it('returns the field errors on a 400 without refreshing', async function() {
    spyOn(RequestStore, 'mutate').and.resolveTo(response(400, { errors: { name: ['max_length'] } }));

    const result = await controller.rename(token, 'x'.repeat(101));

    expect(result).toEqual({ ok: false, errors: { name: ['max_length'] } });
    expect(RequestStore.purge).not.toHaveBeenCalled();
  });

  it('defaults a 400 without errors to none', async function() {
    spyOn(RequestStore, 'mutate').and.resolveTo(response(400, {}));

    expect(await controller.rename(token, 'Bot')).toEqual({ ok: false, errors: {} });
  });

  it('shows token_gone and refreshes on a 404', async function() {
    spyOn(RequestStore, 'mutate').and.resolveTo(response(404));

    const result = await controller.rename(token, 'Bot');

    expect(setters.setNotice).toHaveBeenCalledWith('token_gone');
    expect(RequestStore.purge).toHaveBeenCalled();
    expect(result.ok).toBeTrue();
  });

  it('shows action_error on another failure', async function() {
    spyOn(RequestStore, 'mutate').and.resolveTo(response(500));

    const result = await controller.rename(token, 'Bot');

    expect(setters.setNotice).toHaveBeenCalledWith('action_error');
    expect(result.ok).toBeFalse();
  });

  it('shows action_error on a network error', async function() {
    spyOn(RequestStore, 'mutate').and.rejectWith(new Error('network'));

    const result = await controller.rename(token, 'Bot');

    expect(setters.setNotice).toHaveBeenCalledWith('action_error');
    expect(result).toEqual({ ok: false, errors: {} });
  });
});
