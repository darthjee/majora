import { useEffect, useState } from 'react';
import StlModelFiltersController from './controllers/StlModelFiltersController.js';
import StlModelFiltersHelper from './helpers/StlModelFiltersHelper.jsx';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';
import Translator from '../../../../../i18n/Translator.js';

/**
 * Shape a constant-mode `values` list (`RACE_VALUES`/`ROLE_VALUES`) hash selection down to the
 * `{id, name}[]` picks `MultiResourcePickerField` needs, translating each raw value through
 * `translateOption` — unlike `source`/`collection`, this never needs an async lookup, since the
 * name is derived purely from the constant value itself.
 *
 * @param {string[]} values - Raw constant values read from the hash (e.g. `getAll('race')`).
 * @param {Function} translateOption - `(value) => label string` for each entry.
 * @returns {{id: string, name: string}[]} Picks shaped for `MultiResourcePickerField`.
 */
function buildConstantPicks(values, translateOption) {
  return values.map((value) => ({ id: value, name: translateOption(value) }));
}

/**
 * STL model filter/search bar rendered above the STL models list, with a Name text search,
 * Type/Size dropdowns, Races/Roles/Sources/Collections pickers, a Tags field, a Query button and
 * a Clear button. Draft fields are pre-populated from the current hash's `name`/`type`/`size`/
 * `race`/`roles`/`source`/`collection`/`tags` query params so deep-linked filtered URLs restore
 * the UI — `source`/`collection` picks are resolved asynchronously (each hash id fetched
 * individually through `RequestStore`), since only their id is known from the hash.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onQuery - Called with the built `{name, type, size, race, roles,
 *   source, collection, tags}` query object (blank/empty fields omitted) when the Query button
 *   is clicked.
 * @param {Function} props.onClear - Called when the Clear button is clicked, after the draft
 *   fields have been reset to blank/empty.
 * @returns {React.ReactElement} rendered STL model filters bar.
 */
export default function StlModelFilters({ onQuery, onClear }) {
  const initialFilters = new HashRouteResolver().getFilterParams();
  const [name, setName] = useState(initialFilters.get('name') ?? '');
  const [type, setType] = useState(initialFilters.get('type') ?? '');
  const [size, setSize] = useState(initialFilters.get('size') ?? '');
  const [races, setRaces] = useState(
    buildConstantPicks(initialFilters.getAll('race'), (value) => Translator.t(`stl_model_page.race_${value}`)),
  );
  const [roles, setRoles] = useState(
    buildConstantPicks(initialFilters.getAll('roles'), (value) => Translator.t(`stl_model_page.role_${value}`)),
  );
  const [sources, setSources] = useState([]);
  const [collections, setCollections] = useState([]);
  const [tags, setTags] = useState(initialFilters.getAll('tags'));
  const [tagInput, setTagInput] = useState('');

  const controller = new StlModelFiltersController(
    setName, setType, setSize, setRaces, setRoles, setSources, setCollections, setTags,
  );

  useEffect(() => {
    StlModelFiltersController.loadResourcePicks('source', initialFilters.getAll('source'), setSources);
    StlModelFiltersController.loadResourcePicks('collection', initialFilters.getAll('collection'), setCollections);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleQuery = () => {
    onQuery(controller.buildQuery(name, type, size, races, roles, sources, collections, tags));
  };

  const handleClear = () => {
    controller.clear();
    setTagInput('');
    onClear();
  };

  const handleAddTag = () => {
    controller.addTag(tags, tagInput);
    setTagInput('');
  };

  return StlModelFiltersHelper.render(
    {
      name, type, size, races, roles, sources, collections, tags, tagInput,
    },
    {
      onNameChange: (value) => controller.handleNameChange(value),
      onTypeChange: (value) => controller.handleTypeChange(value),
      onSizeChange: (value) => controller.handleSizeChange(value),
      onRacesChange: (value) => controller.handleRacesChange(value),
      onRolesChange: (value) => controller.handleRolesChange(value),
      onSourcesChange: (value) => controller.handleSourcesChange(value),
      onCollectionsChange: (value) => controller.handleCollectionsChange(value),
      onTagInputChange: (event) => setTagInput(event.target.value),
      onAddTag: handleAddTag,
      onRemoveTag: (tag) => controller.removeTag(tags, tag),
      onQuery: handleQuery,
      onClear: handleClear,
    },
  );
}
