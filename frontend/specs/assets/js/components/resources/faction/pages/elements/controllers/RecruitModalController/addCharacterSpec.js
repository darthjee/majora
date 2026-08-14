import RecruitModalController
  from '../../../../../../../../../../assets/js/components/resources/faction/pages/elements/controllers/RecruitModalController.js';

describe('RecruitModalController', function() {
  describe('#addCharacter', function() {
    const character = { id: 3, name: 'Aria' };

    it('fetches the summary and adds a new row when the character is not yet listed', async function() {
      const controller = new RecruitModalController();
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(true));
      const setReceiving = jasmine.createSpy('setReceiving');

      await controller.addCharacter(character, 'pcs', 'demo', 9, [], setReceiving);

      expect(controller.fetchSummary).toHaveBeenCalledWith('demo', 9, 'pcs', 3);
      expect(setReceiving).toHaveBeenCalledWith([{
        character, kind: 'pcs', enlisted: true, result: null,
      }]);
    });

    it('is a no-op when the character is already listed', async function() {
      const controller = new RecruitModalController();
      spyOn(controller, 'fetchSummary');
      const existing = [{
        character, kind: 'pcs', enlisted: false, result: null,
      }];
      const setReceiving = jasmine.createSpy('setReceiving');

      await controller.addCharacter(character, 'pcs', 'demo', 9, existing, setReceiving);

      expect(controller.fetchSummary).not.toHaveBeenCalled();
      expect(setReceiving).not.toHaveBeenCalled();
    });

    it('treats a pc and an npc sharing the same id as distinct rows', async function() {
      const controller = new RecruitModalController();
      spyOn(controller, 'fetchSummary').and.returnValue(Promise.resolve(false));
      const existing = [{
        character, kind: 'npcs', enlisted: false, result: null,
      }];
      const setReceiving = jasmine.createSpy('setReceiving');

      await controller.addCharacter(character, 'pcs', 'demo', 9, existing, setReceiving);

      expect(setReceiving).toHaveBeenCalledWith([
        existing[0],
        {
          character, kind: 'pcs', enlisted: false, result: null,
        },
      ]);
    });
  });
});
