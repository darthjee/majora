import RequestStore from '../../../../../../../../../assets/js/utils/requests/RequestStore.js';
import AccessStore from '../../../../../../../../../assets/js/utils/access/store/AccessStore.js';
import { stubAccessPair } from '../../../../../../../../support/accessStoreStub.js';
import { buildTreasure } from '../../../../../../../../support/factories.js';
import { buildSetters, runController } from './support.js';

describe('GameTreasureController canGiveHidden (issue #833)', function() {
  beforeEach(function() {
    spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
      data: buildTreasure({
        id: 1, name: 'Sword', value: 100, game_slug: 'demo',
      }),
    }));
    spyOn(AccessStore, 'ensureGameAccess').and.returnValue(Promise.resolve({}));
    stubAccessPair('ensureTreasurePermissions', 'getTreasurePermissions', { can_edit: false }, { can_edit: false });
  });

  it('derives from the same ensureGameAccess call as canUploadPhoto', async function() {
    await runController('#/games/demo/treasures/1', buildSetters());

    expect(AccessStore.ensureGameAccess).toHaveBeenCalledTimes(1);
    expect(AccessStore.ensureGameAccess).toHaveBeenCalledWith('demo');
  });

  it('is true for a superuser', async function() {
    AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_superuser: true }));
    const setters = buildSetters();

    await runController('#/games/demo/treasures/1', setters);

    expect(setters.setCanGiveHidden).toHaveBeenCalledWith(true);
  });

  it('is false for staff', async function() {
    AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_staff: true }));
    const setters = buildSetters();

    await runController('#/games/demo/treasures/1', setters);

    expect(setters.setCanGiveHidden).toHaveBeenCalledWith(false);
  });

  it('is true for the game DM', async function() {
    AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_dm: true }));
    const setters = buildSetters();

    await runController('#/games/demo/treasures/1', setters);

    expect(setters.setCanGiveHidden).toHaveBeenCalledWith(true);
  });

  it('is false for a mere player', async function() {
    AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({ is_player: true }));
    const setters = buildSetters();

    await runController('#/games/demo/treasures/1', setters);

    expect(setters.setCanGiveHidden).toHaveBeenCalledWith(false);
  });

  it('is false for an unrelated authenticated user', async function() {
    AccessStore.ensureGameAccess.and.returnValue(Promise.resolve({
      is_superuser: false, is_staff: false, is_dm: false, is_player: false,
    }));
    const setters = buildSetters();

    await runController('#/games/demo/treasures/1', setters);

    expect(setters.setCanGiveHidden).toHaveBeenCalledWith(false);
  });

  it('fails closed to false when the access check rejects', async function() {
    AccessStore.ensureGameAccess.and.returnValue(Promise.reject(new Error('nope')));
    const setters = buildSetters();

    await runController('#/games/demo/treasures/1', setters);

    expect(setters.setCanGiveHidden).toHaveBeenCalledWith(false);
  });
});
