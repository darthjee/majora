import CreateApiTokenModalController from '../../../../../../../../../../assets/js/components/resources/account/pages/elements/controllers/CreateApiTokenModalController.js';

describe('CreateApiTokenModalController.canSubmit', function() {
  const options = { scopes: ['npcs:read'], games: [], all_games: false };
  const expiry = { choice: '90', customDate: '' };

  it('is false with no scope ticked', function() {
    expect(CreateApiTokenModalController.canSubmit({ scopes: [], expiry }, 'idle', options)).toBeFalse();
  });

  it('is true with a scope ticked', function() {
    expect(CreateApiTokenModalController.canSubmit({ scopes: ['npcs:read'], expiry }, 'idle', options)).toBeTrue();
  });

  it('is true again after an error, for a retry', function() {
    expect(CreateApiTokenModalController.canSubmit({ scopes: ['npcs:read'], expiry }, 'error', options)).toBeTrue();
  });

  it('is false while submitting', function() {
    expect(CreateApiTokenModalController.canSubmit({ scopes: ['npcs:read'], expiry }, 'submitting', options)).toBeFalse();
  });

  it('is false when the options failed to load', function() {
    expect(CreateApiTokenModalController.canSubmit({ scopes: ['npcs:read'], expiry }, 'idle', null)).toBeFalse();
  });

  it('is false for a custom expiry without a date', function() {
    const form = { scopes: ['npcs:read'], expiry: { choice: 'custom', customDate: '' } };

    expect(CreateApiTokenModalController.canSubmit(form, 'idle', options)).toBeFalse();
  });

  it('is true for a custom expiry with a date', function() {
    const form = { scopes: ['npcs:read'], expiry: { choice: 'custom', customDate: '2026-04-15' } };

    expect(CreateApiTokenModalController.canSubmit(form, 'idle', options)).toBeTrue();
  });
});
