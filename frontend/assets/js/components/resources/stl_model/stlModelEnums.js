/**
 * Ordered `db_value` lists for `StlModel`'s `type`/`race`/`role`/`size` fields — the frontend
 * half of the shared field/value contract (`docs/agents/plans/820-improve-miniatureve-miniature-
 * stl-model/plan.md`'s "Shared contracts" section, extending the original contract documented in
 * `docs/agents/plans/1069-grow-stl-model-and-create-and-show-page/plan.md`). Must match backend's
 * `TYPE_CHOICES`/`RACE_CHOICES`/`ROLE_CHOICES`/`SIZE_CHOICES` order and spelling exactly, and
 * translator's `stl_model_page.type_<value>`/`race_<value>`/`role_<value>`/`size_<value>` i18n
 * keys. `race`/`role` are exposed as arrays (`races`/`roles`) on the API, but each entry is still
 * validated against these same constant lists.
 *
 * @type {string[]}
 */
export const TYPE_VALUES = ['terrain', 'prop', 'creature', 'other'];

/**
 * @type {string[]}
 */
export const RACE_VALUES = [
  'human', 'elf', 'dwarf', 'halfling', 'gnome', 'half-elf', 'half-orc', 'tiefling',
  'dragonborn', 'orc', 'goblin', 'turtlefolk', 'cthulhufolk', 'humanoid', 'construct',
  'monstrosity', 'undead', 'aberration', 'beast', 'alien', 'fiend', 'fey', 'giant', 'dragon',
  'celestial', 'elemental', 'cyborg', 'plant', 'ooze',
];

/**
 * @type {string[]}
 */
export const ROLE_VALUES = [
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue',
  'sorcerer', 'warlock', 'wizard', 'archer',
];

/**
 * @type {string[]}
 */
export const SIZE_VALUES = ['tiny', 'small', 'medium', 'huge', 'gargantuan', 'life'];
