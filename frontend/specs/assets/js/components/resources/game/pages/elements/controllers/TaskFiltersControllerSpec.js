import TaskFiltersController
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/controllers/TaskFiltersController.js';
import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';

describe('TaskFiltersController', function() {
  describe('.initialFilters', function() {
    it('keeps a known category and completed value', function() {
      const params = new URLSearchParams('category=painting&completed=true');

      expect(TaskFiltersController.initialFilters(params)).toEqual({
        category: 'painting', completed: 'true', sessionMode: '', sessionId: null,
      });
    });

    it('returns blank values when the params are absent', function() {
      expect(TaskFiltersController.initialFilters(new URLSearchParams(''))).toEqual({
        category: '', completed: '', sessionMode: '', sessionId: null,
      });
    });

    it('returns blank values for unknown category and completed values', function() {
      const params = new URLSearchParams('category=dancing&completed=TRUE');

      expect(TaskFiltersController.initialFilters(params)).toEqual({
        category: '', completed: '', sessionMode: '', sessionId: null,
      });
    });

    it('maps session=none to the none mode', function() {
      const params = new URLSearchParams('session=none');

      expect(TaskFiltersController.initialFilters(params)).toEqual(jasmine.objectContaining({
        sessionMode: 'none', sessionId: null,
      }));
    });

    it('maps a numeric session to the specific mode with a pending id', function() {
      const params = new URLSearchParams('session=42');

      expect(TaskFiltersController.initialFilters(params)).toEqual(jasmine.objectContaining({
        sessionMode: 'specific', sessionId: '42',
      }));
    });

    it('maps a garbage session to a blank mode', function() {
      ['abc', '3a', '-1', ''].forEach((value) => {
        const params = new URLSearchParams(`session=${value}`);

        expect(TaskFiltersController.initialFilters(params)).toEqual(jasmine.objectContaining({
          sessionMode: '', sessionId: null,
        }));
      });
    });
  });

  describe('#handleCategoryChange', function() {
    it('sets the draft category', function() {
      const setCategory = jasmine.createSpy('setCategory');
      const controller = new TaskFiltersController(setCategory, jasmine.createSpy());

      controller.handleCategoryChange('painting');

      expect(setCategory).toHaveBeenCalledWith('painting');
    });
  });

  describe('#handleCompletedChange', function() {
    it('sets the draft completed value', function() {
      const setCompleted = jasmine.createSpy('setCompleted');
      const controller = new TaskFiltersController(jasmine.createSpy(), setCompleted);

      controller.handleCompletedChange('false');

      expect(setCompleted).toHaveBeenCalledWith('false');
    });
  });

  describe('#handleSessionModeChange', function() {
    let setSessionMode;
    let setSessionPick;
    let controller;

    beforeEach(function() {
      setSessionMode = jasmine.createSpy('setSessionMode');
      setSessionPick = jasmine.createSpy('setSessionPick');
      controller = new TaskFiltersController(jasmine.createSpy(), jasmine.createSpy(), setSessionMode, setSessionPick);
    });

    it('sets the specific mode, keeping the pick', function() {
      controller.handleSessionModeChange('specific');

      expect(setSessionMode).toHaveBeenCalledWith('specific');
      expect(setSessionPick).not.toHaveBeenCalled();
    });

    it('drops the pick when leaving the specific mode', function() {
      controller.handleSessionModeChange('none');

      expect(setSessionMode).toHaveBeenCalledWith('none');
      expect(setSessionPick).toHaveBeenCalledWith(null);
    });
  });

  describe('#handleSessionPick', function() {
    it('sets the draft session pick', function() {
      const setSessionPick = jasmine.createSpy('setSessionPick');
      const controller = new TaskFiltersController(
        jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(), setSessionPick,
      );

      controller.handleSessionPick({ id: 3, name: 'Session 3' });

      expect(setSessionPick).toHaveBeenCalledWith({ id: 3, name: 'Session 3' });
    });
  });

  describe('#buildQuery', function() {
    const controller = new TaskFiltersController(
      jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(), jasmine.createSpy(),
    );

    it('sends session=none in the none mode', function() {
      expect(controller.buildQuery('', '', 'none', null)).toEqual({ session: 'none' });
    });

    it('sends the picked session id in the specific mode', function() {
      expect(controller.buildQuery('painting', '', 'specific', { id: 3, name: 'Session 3' })).toEqual({
        category: 'painting', session: '3',
      });
    });

    it('omits the session in the specific mode with nothing picked', function() {
      expect(controller.buildQuery('', '', 'specific', null)).toEqual({});
    });

    it('omits the session in the blank mode', function() {
      expect(controller.buildQuery('', 'true', '', { id: 3, name: 'Session 3' })).toEqual({ completed: 'true' });
    });

    it('omits both fields when blank', function() {
      expect(controller.buildQuery('', '')).toEqual({});
    });

    it('omits a blank category', function() {
      expect(controller.buildQuery('', 'true')).toEqual({ completed: 'true' });
    });

    it('omits a blank completed value', function() {
      expect(controller.buildQuery('painting', '')).toEqual({ category: 'painting' });
    });

    it('includes both fields when set', function() {
      expect(controller.buildQuery('painting', 'false')).toEqual({ category: 'painting', completed: 'false' });
    });
  });

  describe('#clear', function() {
    it('resets every draft field to blank', function() {
      const setCategory = jasmine.createSpy('setCategory');
      const setCompleted = jasmine.createSpy('setCompleted');
      const setSessionMode = jasmine.createSpy('setSessionMode');
      const setSessionPick = jasmine.createSpy('setSessionPick');
      const controller = new TaskFiltersController(setCategory, setCompleted, setSessionMode, setSessionPick);

      controller.clear();

      expect(setCategory).toHaveBeenCalledWith('');
      expect(setCompleted).toHaveBeenCalledWith('');
      expect(setSessionMode).toHaveBeenCalledWith('');
      expect(setSessionPick).toHaveBeenCalledWith(null);
    });
  });

  describe('.fetchSessionPick', function() {
    it('fetches the session and shapes it as a picker item', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: { id: 3, title: 'Session 3' } }));

      const pick = await TaskFiltersController.fetchSessionPick('demo', '3');

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'session', quantityType: 'single', params: { gameSlug: 'demo', id: '3' },
      }));
      expect(pick).toEqual({ id: 3, name: 'Session 3' });
    });

    it('resolves to null when the request fails', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.reject(new Error('not found')));

      expect(await TaskFiltersController.fetchSessionPick('demo', '3')).toBeNull();
    });
  });

  describe('#buildSessionPickEffect', function() {
    let setSessionMode;
    let setSessionPick;
    let controller;

    beforeEach(function() {
      setSessionMode = jasmine.createSpy('setSessionMode');
      setSessionPick = jasmine.createSpy('setSessionPick');
      controller = new TaskFiltersController(jasmine.createSpy(), jasmine.createSpy(), setSessionMode, setSessionPick);
    });

    it('does nothing without a pending session id', function() {
      spyOn(TaskFiltersController, 'fetchSessionPick');

      expect(controller.buildSessionPickEffect('demo', null)()).toBeUndefined();
      expect(TaskFiltersController.fetchSessionPick).not.toHaveBeenCalled();
    });

    it('stores the fetched session as the pick', async function() {
      const fetched = Promise.resolve({ id: 3, name: 'Session 3' });
      spyOn(TaskFiltersController, 'fetchSessionPick').and.returnValue(fetched);

      controller.buildSessionPickEffect('demo', '3')();
      await fetched;

      expect(TaskFiltersController.fetchSessionPick).toHaveBeenCalledWith('demo', '3');
      expect(setSessionPick).toHaveBeenCalledWith({ id: 3, name: 'Session 3' });
      expect(setSessionMode).not.toHaveBeenCalled();
    });

    it('falls back to a blank mode when the session cannot be loaded', async function() {
      const fetched = Promise.resolve(null);
      spyOn(TaskFiltersController, 'fetchSessionPick').and.returnValue(fetched);

      controller.buildSessionPickEffect('demo', '3')();
      await fetched;

      expect(setSessionMode).toHaveBeenCalledWith('');
      expect(setSessionPick).not.toHaveBeenCalled();
    });

    it('ignores a result arriving after cleanup', async function() {
      const fetched = Promise.resolve({ id: 3, name: 'Session 3' });
      spyOn(TaskFiltersController, 'fetchSessionPick').and.returnValue(fetched);

      const cleanup = controller.buildSessionPickEffect('demo', '3')();
      cleanup();
      await fetched;

      expect(setSessionPick).not.toHaveBeenCalled();
    });
  });
});
