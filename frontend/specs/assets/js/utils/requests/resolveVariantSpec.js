import resolveVariant from '../../../../../assets/js/utils/requests/resolveVariant.js';

describe('resolveVariant', function() {
  function config() {
    return {
      regular: { path: ({ gameSlug }) => `/games/${gameSlug}/npcs.json`, permission: null },
      private: { path: ({ gameSlug }) => `/games/${gameSlug}/npcs/all.json`, permission: 'can_edit' },
    };
  }

  it('picks the private variant when the permission is granted', function() {
    const variant = resolveVariant(config(), { can_edit: true }, { gameSlug: 'demo' });

    expect(variant.name).toBe('private');
    expect(variant.path({ gameSlug: 'demo' })).toBe('/games/demo/npcs/all.json');
  });

  it('falls back to the regular variant when the permission is not granted', function() {
    const variant = resolveVariant(config(), { can_edit: false }, { gameSlug: 'demo' });

    expect(variant.name).toBe('regular');
    expect(variant.path({ gameSlug: 'demo' })).toBe('/games/demo/npcs.json');
  });

  it('falls back to the regular variant when permissions is empty/unknown', function() {
    const variant = resolveVariant(config(), {}, { gameSlug: 'demo' });

    expect(variant.name).toBe('regular');
  });

  it('falls back to the regular variant when the private permission is null (always open)', function() {
    const openConfig = {
      regular: { path: () => '/a.json', permission: null },
      private: { path: () => '/a.json', permission: null },
    };

    const variant = resolveVariant(openConfig, { can_edit: true }, {});

    expect(variant.name).toBe('regular');
  });

  it('resolves a function permission against params before checking it', function() {
    const paramsConfig = {
      regular: { path: () => '/regular.json', permission: null },
      private: { path: () => '/private.json', permission: (params) => (params.kind === 'npcs' ? 'can_edit' : null) },
    };

    const grantedForNpc = resolveVariant(paramsConfig, { can_edit: true }, { kind: 'npcs' });
    const notGrantedForPc = resolveVariant(paramsConfig, { can_edit: true }, { kind: 'pcs' });

    expect(grantedForNpc.name).toBe('private');
    expect(notGrantedForPc.name).toBe('regular');
  });
});
