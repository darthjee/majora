import MyAccountController from '../../../../../../../../../assets/js/components/resources/account/pages/controllers/MyAccountController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/AuthStorage.js';

describe('MyAccountController', function() {
  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#submitForm', function() {
    let setName;
    let setEmail;
    let setLoading;
    let setFieldErrors;
    let setStatus;
    let client;

    beforeEach(function() {
      setName = jasmine.createSpy('setName');
      setEmail = jasmine.createSpy('setEmail');
      setLoading = jasmine.createSpy('setLoading');
      setFieldErrors = jasmine.createSpy('setFieldErrors');
      setStatus = jasmine.createSpy('setStatus');
      client = jasmine.createSpyObj('client', ['fetchAccount', 'updateAccount']);
      spyOn(AuthStorage, 'getToken').and.returnValue('tok-abc');
      client.updateAccount.and.returnValue(Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ name: 'Jane', email: 'jane@example.com' }),
      }));
    });

    const buildController = () => new MyAccountController(setName, setEmail, setLoading, client);

    it('prevents default, resets status/errors, and submits the fields payload', async function() {
      const event = jasmine.createSpyObj('event', ['preventDefault']);

      await buildController().submitForm(
        event,
        {
          name: 'Jane', email: 'jane@example.com', password: '', passwordConfirmation: '',
        },
        { setStatus, setFieldErrors },
      );

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setStatus).toHaveBeenCalledWith('submitting');
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(client.updateAccount).toHaveBeenCalledWith(
        'tok-abc',
        {
          name: 'Jane', email: 'jane@example.com', password: '', passwordConfirmation: '',
        },
      );
    });

    it('sets a success status on success', async function() {
      await buildController().submitForm(
        undefined,
        {
          name: 'Jane', email: 'jane@example.com', password: '', passwordConfirmation: '',
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('success');
    });

    it('sets field errors on a 400 response', async function() {
      client.updateAccount.and.returnValue(Promise.resolve({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ errors: { email: ['is already taken'] } }),
      }));

      await buildController().submitForm(
        undefined,
        {
          name: 'Jane', email: 'taken@example.com', password: '', passwordConfirmation: '',
        },
        { setStatus, setFieldErrors },
      );

      expect(setFieldErrors).toHaveBeenCalledWith({ email: ['is already taken'] });
    });

    it('sets status to error on a non-400 failure', async function() {
      client.updateAccount.and.returnValue(Promise.resolve({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }));

      await buildController().submitForm(
        undefined,
        {
          name: 'Jane', email: 'jane@example.com', password: '', passwordConfirmation: '',
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });

    it('sets status to error when the network request throws', async function() {
      client.updateAccount.and.returnValue(Promise.reject(new Error('network error')));

      await buildController().submitForm(
        undefined,
        {
          name: 'Jane', email: 'jane@example.com', password: '', passwordConfirmation: '',
        },
        { setStatus, setFieldErrors },
      );

      expect(setStatus).toHaveBeenCalledWith('error');
    });
  });
});
