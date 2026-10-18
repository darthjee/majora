import CreateApiTokenModalController from '../../../../../../../../../../assets/js/components/resources/account/pages/elements/controllers/CreateApiTokenModalController.js';

describe('CreateApiTokenModalController.canSubmit', function() {
  const options = { scopes: ['npcs:read'], games: [], all_games: false };

  it('is false with no scope ticked', function() {
    expect(CreateApiTokenModalController.canSubmit({ scopes: [] }, 'idle', options)).toBeFalse();
  });

  it('is true with a scope ticked', function() {
    expect(CreateApiTokenModalController.canSubmit({ scopes: ['npcs:read'] }, 'idle', options)).toBeTrue();
  });

  it('is true again after an error, for a retry', function() {
    expect(CreateApiTokenModalController.canSubmit({ scopes: ['npcs:read'] }, 'error', options)).toBeTrue();
  });

  it('is false while submitting', function() {
    expect(CreateApiTokenModalController.canSubmit({ scopes: ['npcs:read'] }, 'submitting', options)).toBeFalse();
  });

  it('is false when the options failed to load', function() {
    expect(CreateApiTokenModalController.canSubmit({ scopes: ['npcs:read'] }, 'idle', null)).toBeFalse();
  });
});
