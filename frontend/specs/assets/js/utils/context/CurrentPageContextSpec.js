import CurrentPageContext from '../../../../../assets/js/utils/context/CurrentPageContext.js';

describe('CurrentPageContext', function() {
  describe('.build', function() {
    it('passes raw state fields through unchanged', function() {
      const state = {
        loggedIn: true,
        isSuperUser: false,
        isStaff: true,
        canViewAs: true,
        testEmailStatus: 'sent',
        facadeEnabled: false,
      };

      const context = CurrentPageContext.build(state);

      expect(context.loggedIn).toBe(true);
      expect(context.isSuperUser).toBe(false);
      expect(context.isStaff).toBe(true);
      expect(context.canViewAs).toBe(true);
      expect(context.testEmailStatus).toBe('sent');
      expect(context.facadeEnabled).toBe(false);
    });

    describe('isGamePage', function() {
      it('is true when route has a gameSlug', function() {
        expect(CurrentPageContext.build({ route: { gameSlug: 'epic-quest' } }).isGamePage).toBe(true);
      });

      it('is false when route has no gameSlug', function() {
        expect(CurrentPageContext.build({ route: { page: 'home' } }).isGamePage).toBe(false);
      });

      it('is false when there is no route', function() {
        expect(CurrentPageContext.build({}).isGamePage).toBe(false);
      });
    });

    describe('isPcPage', function() {
      it('is true on a pcCharacter* route', function() {
        expect(CurrentPageContext.build({ route: { page: 'pcCharacterPhotos' } }).isPcPage).toBe(true);
      });

      it('is false on a non-pc route', function() {
        expect(CurrentPageContext.build({ route: { page: 'npcCharacter' } }).isPcPage).toBe(false);
      });

      it('is false when there is no route', function() {
        expect(CurrentPageContext.build({}).isPcPage).toBe(false);
      });
    });

    describe('isNpcPage', function() {
      it('is true on an npcCharacter* route', function() {
        expect(CurrentPageContext.build({ route: { page: 'npcCharacterItems' } }).isNpcPage).toBe(true);
      });

      it('is false on a non-npc route', function() {
        expect(CurrentPageContext.build({ route: { page: 'pcCharacter' } }).isNpcPage).toBe(false);
      });

      it('is false when there is no route', function() {
        expect(CurrentPageContext.build({}).isNpcPage).toBe(false);
      });
    });

    describe('hasGameAccess', function() {
      ['is_dm', 'is_player', 'is_superuser', 'is_staff'].forEach((field) => {
        it(`is true when gameAccess.${field} is true`, function() {
          const gameAccess = { is_dm: false, is_player: false, is_superuser: false, is_staff: false, [field]: true };

          expect(CurrentPageContext.build({ gameAccess }).hasGameAccess).toBe(true);
        });
      });

      it('is false when every gameAccess role flag is false', function() {
        const gameAccess = { is_dm: false, is_player: false, is_superuser: false, is_staff: false };

        expect(CurrentPageContext.build({ gameAccess }).hasGameAccess).toBe(false);
      });

      it('is false when gameAccess is absent', function() {
        expect(CurrentPageContext.build({}).hasGameAccess).toBe(false);
      });
    });
  });
});
