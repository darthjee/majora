import StaffUserEditController
  from '../../../../../../../../../assets/js/components/resources/staff_user/pages/controllers/StaffUserEditController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('StaffUserEditController', function() {
  describe('#submitForm', function() {
    let setUser;
    let setLoading;
    let setError;
    let setFieldErrors;
    let setStatus;
    let mutateSpy;

    beforeEach(function() {
      setUser = jasmine.createSpy('setUser');
      setLoading = jasmine.createSpy('setLoading');
      setError = jasmine.createSpy('setError');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      mutateSpy = spyOn(RequestStore, 'mutate').and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 1, name: 'Jane', email: 'jane@example.com' }),
      }));
    });

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const controller = new StaffUserEditController(setUser, setLoading, setError, setFieldErrors);
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          event,
          '1',
          { name: 'Jane', email: 'jane@example.com' },
          { setStatus, setFieldErrors },
        );

        expect(event.preventDefault).toHaveBeenCalled();
        expect(setStatus).toHaveBeenCalledWith('submitting');
        expect(setFieldErrors).toHaveBeenCalledWith({});
        expect(mutateSpy).toHaveBeenCalledWith({
          componentName: 'StaffUserEditController',
          resource: 'staffUser',
          method: 'PATCH',
          quantityType: 'single',
          params: { id: '1' },
          body: { name: 'Jane', email: 'jane@example.com' },
        });
      } finally {
        delete globalThis.window;
      }
    });

    it('redirects to the user detail page on success', async function() {
      const controller = new StaffUserEditController(setUser, setLoading, setError, setFieldErrors);
      const fakeWindow = { location: { hash: '' } };
      globalThis.window = fakeWindow;

      try {
        await controller.submitForm(
          undefined,
          '5',
          { name: 'Jane', email: 'jane@example.com' },
          { setStatus, setFieldErrors },
        );

        expect(fakeWindow.location.hash).toBe('/staff/users/5');
      } finally {
        delete globalThis.window;
      }
    });

    it('sets field errors on a 400 response', async function() {
      mutateSpy.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { email: ['is already taken'] } }),
      }));

      const controller = new StaffUserEditController(setUser, setLoading, setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        '1',
        { name: 'Jane', email: 'taken@example.com' },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ email: ['is already taken'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      mutateSpy.and.returnValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new StaffUserEditController(setUser, setLoading, setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        '1',
        { name: 'Jane', email: 'jane@example.com' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      mutateSpy.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new StaffUserEditController(setUser, setLoading, setError, setFieldErrors);

      await controller.submitForm(
        undefined,
        '1',
        { name: 'Jane', email: 'jane@example.com' },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
