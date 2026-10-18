import CreateApiTokenModalController from '../../../../../../../../../../assets/js/components/resources/account/pages/elements/controllers/CreateApiTokenModalController.js';

describe('CreateApiTokenModalController.buildBody', function() {
  const now = new Date('2026-03-10T12:00:00Z');
  const form = {
    name: '  CI bot  ',
    scopes: ['npcs:read', 'npcs:write'],
    games: [{ slug: 'alpha', name: 'Alpha' }, { slug: 'beta', name: 'Beta' }],
    expiry: { choice: '30', customDate: '' },
  };

  it('trims the name, sends the game slugs and converts the expiry', function() {
    expect(CreateApiTokenModalController.buildBody(form, now)).toEqual({
      name: 'CI bot',
      scopes: ['npcs:read', 'npcs:write'],
      games: ['alpha', 'beta'],
      expires_at: '2026-04-09T12:00:00.000Z',
    });
  });

  it('sends a null expiry for never', function() {
    const body = CreateApiTokenModalController.buildBody({ ...form, expiry: { choice: 'never', customDate: '' } }, now);

    expect(body.expires_at).toBeNull();
  });

  it('sends the end of the custom day in local time', function() {
    const body = CreateApiTokenModalController.buildBody(
      { ...form, expiry: { choice: 'custom', customDate: '2026-04-15' } }, now,
    );

    expect(body.expires_at).toBe(new Date(2026, 3, 15, 23, 59, 59, 999).toISOString());
  });

  it('defaults now to the current time', function() {
    expect(CreateApiTokenModalController.buildBody(form).expires_at).toEqual(jasmine.any(String));
  });
});
