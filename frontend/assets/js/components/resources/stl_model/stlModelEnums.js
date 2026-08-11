/**
 * Ordered `db_value` lists for `StlModel`'s `type`/`race`/`role` fields — the frontend half of
 * the shared field/value contract (`docs/agents/plans/1069-grow-stl-model-and-create-and-show-
 * page/plan.md`'s "Shared contracts" section). Must match backend's `TYPE_CHOICES`/
 * `RACE_CHOICES`/`ROLE_CHOICES` order and spelling exactly, and translator's `stl_model_page.
 * type_<value>`/`race_<value>`/`role_<value>` i18n keys.
 *
 * @type {string[]}
 */
export const TYPE_VALUES = ['terrain', 'prop', 'creature', 'other'];

/**
 * @type {string[]}
 */
export const RACE_VALUES = [
  'human', 'elf', 'dwarf', 'halfling', 'gnome', 'half-elf', 'half-orc', 'tiefling',
  'dragonborn', 'orc', 'goblin',
];

/**
 * @type {string[]}
 */
export const ROLE_VALUES = [
  'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk', 'paladin', 'ranger', 'rogue',
  'sorcerer', 'warlock', 'wizard', 'archer',
];
