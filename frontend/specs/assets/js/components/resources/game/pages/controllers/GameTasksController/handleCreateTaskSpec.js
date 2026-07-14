import GameTasksController
  from '../../../../../../../../../assets/js/components/resources/game/pages/controllers/GameTasksController.js';
import AuthStorage from '../../../../../../../../../assets/js/utils/auth/AuthStorage.js';

describe('GameTasksController', function() {
  let taskClient;
  let setTasks;
  let setFieldErrors;
  let setError;
  let resetForm;
  let tasks;
  let formValues;

  beforeEach(function() {
    taskClient = jasmine.createSpyObj('taskClient', ['fetchTasks', 'createTask', 'updateTask']);
    setTasks = jasmine.createSpy('setTasks');
    setFieldErrors = jasmine.createSpy('setFieldErrors');
    setError = jasmine.createSpy('setError');
    resetForm = jasmine.createSpy('resetForm');
    tasks = [{
      id: 1, short_description: 'Existing', long_description: '', completed: false, session: null,
    }];
    formValues = { shortDescription: 'Prep encounter', longDescription: 'Some details' };
  });

  afterEach(function() {
    AuthStorage.clearToken();
  });

  describe('#handleCreateTask', function() {
    it('prevents default, resets errors, and submits the fields payload', async function() {
      const event = jasmine.createSpyObj('event', ['preventDefault']);
      taskClient.createTask.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({
          id: 2, short_description: 'Prep encounter', long_description: 'Some details', completed: false, session: null,
        }),
      }));

      const controller = new GameTasksController(null, null, null, null, taskClient);
      await controller.handleCreateTask(event, 'demo', formValues, tasks, {
        setTasks, setFieldErrors, setError, resetForm,
      });

      expect(event.preventDefault).toHaveBeenCalled();
      expect(setFieldErrors).toHaveBeenCalledWith({});
      expect(setError).toHaveBeenCalledWith('');
      expect(taskClient.createTask).toHaveBeenCalledWith('demo', null, {
        short_description: 'Prep encounter',
        long_description: 'Some details',
      });
    });

    it('appends the created task and resets the form on success', async function() {
      const created = {
        id: 2, short_description: 'Prep encounter', long_description: 'Some details', completed: false, session: null,
      };
      taskClient.createTask.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve(created),
      }));

      const controller = new GameTasksController(null, null, null, null, taskClient);
      await controller.handleCreateTask(undefined, 'demo', formValues, tasks, {
        setTasks, setFieldErrors, setError, resetForm,
      });

      expect(setTasks).toHaveBeenCalledWith([...tasks, created]);
      expect(resetForm).toHaveBeenCalled();
    });

    it('sets field errors on a 400 response', async function() {
      taskClient.createTask.and.returnValue(Promise.resolve({
        status: 400,
        json: () => Promise.resolve({ errors: { short_description: ['is required'] } }),
      }));

      const controller = new GameTasksController(null, null, null, null, taskClient);
      await controller.handleCreateTask(undefined, 'demo', formValues, tasks, {
        setTasks, setFieldErrors, setError, resetForm,
      });

      expect(setFieldErrors).toHaveBeenCalledWith({ short_description: ['is required'] });
      expect(setTasks).not.toHaveBeenCalledWith([...tasks, jasmine.anything()]);
    });

    it('sets a general error on a non-201/400 failure', async function() {
      taskClient.createTask.and.returnValue(Promise.resolve({
        status: 500,
        json: () => Promise.resolve({}),
      }));

      const controller = new GameTasksController(null, null, null, null, taskClient);
      await controller.handleCreateTask(undefined, 'demo', formValues, tasks, {
        setTasks, setFieldErrors, setError, resetForm,
      });

      expect(setError).toHaveBeenCalledWith('Unable to create task.');
    });

    it('sets a general error when the request throws', async function() {
      taskClient.createTask.and.returnValue(Promise.reject(new Error('network error')));

      const controller = new GameTasksController(null, null, null, null, taskClient);
      await controller.handleCreateTask(undefined, 'demo', formValues, tasks, {
        setTasks, setFieldErrors, setError, resetForm,
      });

      expect(setError).toHaveBeenCalledWith('Unable to create task.');
    });

    it('does not throw when called without an event', async function() {
      taskClient.createTask.and.returnValue(Promise.resolve({
        status: 201,
        json: () => Promise.resolve({
          id: 2, short_description: 'Prep encounter', long_description: '', completed: false, session: null,
        }),
      }));

      const controller = new GameTasksController(null, null, null, null, taskClient);
      await controller.handleCreateTask(undefined, 'demo', formValues, tasks, {
        setTasks, setFieldErrors, setError, resetForm,
      });

      expect(resetForm).toHaveBeenCalled();
    });
  });
});
