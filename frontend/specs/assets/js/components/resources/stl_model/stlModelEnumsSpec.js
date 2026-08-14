import {
  TYPE_VALUES, RACE_VALUES, ROLE_VALUES, SIZE_VALUES,
} from '../../../../../../assets/js/components/resources/stl_model/stlModelEnums.js';

describe('stlModelEnums', function() {
  describe('TYPE_VALUES', function() {
    it('lists the 4 type values', function() {
      expect(TYPE_VALUES).toEqual(['terrain', 'prop', 'creature', 'other']);
    });
  });

  describe('RACE_VALUES', function() {
    it('lists 29 race values', function() {
      expect(RACE_VALUES.length).toBe(29);
    });

    it('starts with the original 11 classic-fantasy races, in order', function() {
      expect(RACE_VALUES.slice(0, 11)).toEqual([
        'human', 'elf', 'dwarf', 'halfling', 'gnome', 'half-elf', 'half-orc', 'tiefling',
        'dragonborn', 'orc', 'goblin',
      ]);
    });

    it('appends the 18 new race values, in order', function() {
      expect(RACE_VALUES.slice(11)).toEqual([
        'turtlefolk', 'cthulhufolk', 'humanoid', 'construct', 'monstrosity', 'undead',
        'aberration', 'beast', 'alien', 'fiend', 'fey', 'giant', 'dragon', 'celestial',
        'elemental', 'cyborg', 'plant', 'ooze',
      ]);
    });

    it('has no duplicate values', function() {
      expect(new Set(RACE_VALUES).size).toBe(RACE_VALUES.length);
    });
  });

  describe('ROLE_VALUES', function() {
    it('lists the unchanged 13 role values, in order', function() {
      expect(ROLE_VALUES).toEqual([
        'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue',
        'sorcerer', 'warlock', 'wizard', 'archer',
      ]);
    });
  });

  describe('SIZE_VALUES', function() {
    it('lists the 6 size values, in order', function() {
      expect(SIZE_VALUES).toEqual(['tiny', 'small', 'medium', 'huge', 'gargantuan', 'life']);
    });
  });
});
