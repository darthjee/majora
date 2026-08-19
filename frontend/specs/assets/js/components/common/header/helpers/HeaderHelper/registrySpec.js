import { AUTH_CONTROL_REGISTRY } from '../../../../../../../../assets/js/components/common/header/helpers/HeaderHelper.jsx';
import { NAV_LINK_REGISTRY } from '../../../../../../../../assets/js/components/common/header/helpers/HeaderNavHelper.jsx';
import CurrentPageContext from '../../../../../../../../assets/js/utils/context/CurrentPageContext.js';

describe('HeaderHelper/HeaderNavHelper registries', function() {
  describe('AUTH_CONTROL_REGISTRY', function() {
    it('has unique ids', function() {
      const ids = AUTH_CONTROL_REGISTRY.map((entry) => entry.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('NAV_LINK_REGISTRY', function() {
    it('has unique ids', function() {
      const ids = NAV_LINK_REGISTRY.map((entry) => entry.id);

      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('rules field names', function() {
    it('only reference fields that CurrentPageContext.build actually produces', function() {
      const context = CurrentPageContext.build({
        loggedIn: true,
        isSuperUser: true,
        isStaff: true,
        canViewAs: true,
        testEmailStatus: 'sent',
        facadeEnabled: true,
        route: { page: 'pcCharacter', gameSlug: 'epic-quest', characterId: '7' },
        gameAccess: { is_dm: true, is_player: true, is_superuser: true, is_staff: true },
      });
      const contextFields = new Set(Object.keys(context));

      const referencedFields = [...AUTH_CONTROL_REGISTRY, ...NAV_LINK_REGISTRY]
        .flatMap((entry) => [
          ...(entry.rules.all ?? []),
          ...(entry.rules.any ?? []),
          ...(entry.rules.none ?? []),
          ...(entry.rules.exists ?? []),
        ]);

      referencedFields.forEach((field) => {
        expect(contextFields.has(field)).toBe(true);
      });
    });
  });
});
