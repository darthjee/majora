import RuleMatcher from '../../../../../assets/js/utils/rules/RuleMatcher.js';
import MajoraLogger from '../../../../../assets/js/utils/logging/MajoraLogger.js';

describe('RuleMatcher', function() {
  let warnSpy;

  beforeEach(function() {
    warnSpy = spyOn(MajoraLogger, 'warn');
  });

  describe('.matches', function() {
    describe('all', function() {
      it('matches when every named field is truthy', function() {
        expect(RuleMatcher.matches({ all: ['loggedIn', 'canViewAs'] }, { loggedIn: true, canViewAs: true })).toBe(true);
      });

      it('does not match when any named field is falsy', function() {
        expect(RuleMatcher.matches({ all: ['loggedIn', 'canViewAs'] }, { loggedIn: true, canViewAs: false })).toBe(false);
      });
    });

    describe('any', function() {
      it('matches when at least one named field is truthy', function() {
        expect(RuleMatcher.matches({ any: ['isSuperUser', 'isStaff'] }, { isSuperUser: false, isStaff: true })).toBe(true);
      });

      it('does not match when every named field is falsy', function() {
        expect(RuleMatcher.matches({ any: ['isSuperUser', 'isStaff'] }, { isSuperUser: false, isStaff: false })).toBe(false);
      });
    });

    describe('none', function() {
      it('matches when every named field is falsy', function() {
        expect(RuleMatcher.matches({ none: ['loggedIn'] }, { loggedIn: false })).toBe(true);
      });

      it('does not match when any named field is truthy', function() {
        expect(RuleMatcher.matches({ none: ['loggedIn'] }, { loggedIn: true })).toBe(false);
      });
    });

    describe('exists', function() {
      it('matches when every named field is non-null', function() {
        expect(RuleMatcher.matches({ exists: ['testEmailStatus'] }, { testEmailStatus: 'sent' })).toBe(true);
      });

      it('does not match when a named field is null', function() {
        expect(RuleMatcher.matches({ exists: ['testEmailStatus'] }, { testEmailStatus: null })).toBe(false);
      });

      it('does not match when a named field is undefined', function() {
        expect(RuleMatcher.matches({ exists: ['testEmailStatus'] }, { testEmailStatus: undefined })).toBe(false);
      });
    });

    describe('combined rule groups', function() {
      it('matches only when every present rule group is satisfied', function() {
        const rules = { all: ['loggedIn'], any: ['isSuperUser', 'isStaff'] };

        expect(RuleMatcher.matches(rules, { loggedIn: true, isSuperUser: true, isStaff: false })).toBe(true);
        expect(RuleMatcher.matches(rules, { loggedIn: false, isSuperUser: true, isStaff: false })).toBe(false);
        expect(RuleMatcher.matches(rules, { loggedIn: true, isSuperUser: false, isStaff: false })).toBe(false);
      });
    });

    describe('unknown field guard', function() {
      it('warns when a rule references a field absent from context', function() {
        RuleMatcher.matches({ all: ['loggedInTypo'] }, { loggedIn: true });

        expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching('loggedInTypo'));
      });

      it('does not warn when every referenced field is present in context (even if falsy)', function() {
        RuleMatcher.matches({ all: ['loggedIn'] }, { loggedIn: false });

        expect(warnSpy).not.toHaveBeenCalled();
      });

      it('still evaluates the rule (as falsy) after warning about an unknown field', function() {
        expect(RuleMatcher.matches({ all: ['loggedInTypo'] }, { loggedIn: true })).toBe(false);
      });
    });

    describe('missing/empty rules guard', function() {
      it('warns and does not match when rules is undefined', function() {
        expect(RuleMatcher.matches(undefined, { loggedIn: true })).toBe(false);
        expect(warnSpy).toHaveBeenCalled();
      });

      it('warns and does not match when rules is an empty object', function() {
        expect(RuleMatcher.matches({}, { loggedIn: true })).toBe(false);
        expect(warnSpy).toHaveBeenCalled();
      });
    });
  });
});
