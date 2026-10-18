import CreateApiTokenModalController from '../../../../../../../../../../assets/js/components/resources/account/pages/elements/controllers/CreateApiTokenModalController.js';
import RequestStore from '../../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('CreateApiTokenModalController#submit', function() {
  const form = {
    name: 'CI', scopes: ['npcs:read'], games: [{ slug: 'alpha', name: 'Alpha' }], expiry: { choice: 'never', customDate: '' },
  };
  let setters;
  let controller;

  const respond = (status, body) => spyOn(RequestStore, 'mutate').and.resolveTo({
    ok: status >= 200 && status < 300, status, json: () => Promise.resolve(body),
  });

  beforeEach(function() {
    setters = {
      setStatus: jasmine.createSpy('setStatus'),
      setFieldErrors: jasmine.createSpy('setFieldErrors'),
      setSecret: jasmine.createSpy('setSecret'),
      setCopyStatus: jasmine.createSpy('setCopyStatus'),
    };
    controller = new CreateApiTokenModalController(setters);
  });

  it('prevents the default submit and posts the body to apiToken.collection', async function() {
    respond(201, { id: 1, name: 'CI', token: 'mjr_secret' });
    const event = { preventDefault: jasmine.createSpy('preventDefault') };

    await controller.submit(event, form);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(RequestStore.mutate).toHaveBeenCalledWith({
      componentName: 'CreateApiTokenModal',
      resource: 'apiToken',
      method: 'POST',
      quantityType: 'collection',
      body: {
        name: 'CI', scopes: ['npcs:read'], games: ['alpha'], expires_at: null,
      },
    });
    expect(setters.setStatus).toHaveBeenCalledWith('submitting');
    expect(setters.setFieldErrors).toHaveBeenCalledWith({});
  });

  it('keeps only the token and name on a 201', async function() {
    respond(201, {
      id: 1, name: 'CI', prefix: 'ab', token: 'mjr_secret',
    });

    await controller.submit(undefined, form);

    expect(setters.setSecret).toHaveBeenCalledWith({ token: 'mjr_secret', name: 'CI' });
    expect(setters.setStatus.calls.mostRecent().args).toEqual(['idle']);
  });

  it('maps a 400 body to the field errors, including games max_length', async function() {
    const errors = { name: ['blank'], games: ['max_length'], expires_at: ['expires_in_past'] };
    respond(400, { errors });

    await controller.submit(undefined, form);

    expect(setters.setFieldErrors).toHaveBeenCalledWith(errors);
    expect(setters.setSecret).not.toHaveBeenCalled();
    expect(setters.setStatus.calls.mostRecent().args).toEqual(['idle']);
  });

  it('defaults a 400 without errors to no field errors', async function() {
    respond(400, {});

    await controller.submit(undefined, form);

    expect(setters.setFieldErrors.calls.mostRecent().args).toEqual([{}]);
  });

  it('sets the error status on a 5xx without touching the form', async function() {
    respond(500, {});

    await controller.submit(undefined, form);

    expect(setters.setStatus.calls.mostRecent().args).toEqual(['error']);
    expect(setters.setSecret).not.toHaveBeenCalled();
  });

  it('sets the error status on a network error', async function() {
    spyOn(RequestStore, 'mutate').and.rejectWith(new Error('network'));

    await controller.submit(undefined, form);

    expect(setters.setStatus.calls.mostRecent().args).toEqual(['error']);
  });
});
