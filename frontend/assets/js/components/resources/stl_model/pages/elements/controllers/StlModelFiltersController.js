import RequestStore from '../../../../../../utils/requests/RequestStore.js';
import buildFilterQuery from '../../../../../../utils/filters/buildFilterQuery.js';
import { buildTagsAfterAdd } from '../../StlModelNew.jsx';

/**
 * Manages draft filter state and query building for the StlModelFilters element.
 */
export default class StlModelFiltersController {
  /**
   * Creates a new StlModelFiltersController instance.
   *
   * @param {Function} setName - state setter for the draft name field.
   * @param {Function} setType - state setter for the draft type field.
   * @param {Function} setSize - state setter for the draft size field.
   * @param {Function} setRaces - state setter for the draft races field (`{id, name}[]`).
   * @param {Function} setRoles - state setter for the draft roles field (`{id, name}[]`).
   * @param {Function} setSources - state setter for the draft sources field (`{id, name}[]`).
   * @param {Function} setCollections - state setter for the draft collections field
   *   (`{id, name}[]`).
   * @param {Function} setTags - state setter for the draft tags field (`string[]`).
   */
  constructor(setName, setType, setSize, setRaces, setRoles, setSources, setCollections, setTags) {
    this.setName = setName;
    this.setType = setType;
    this.setSize = setSize;
    this.setRaces = setRaces;
    this.setRoles = setRoles;
    this.setSources = setSources;
    this.setCollections = setCollections;
    this.setTags = setTags;
  }

  /**
   * Resolve a picked, hash-seeded `resource` id list (just numbers) down to the `{id, name}[]`
   * shape `MultiResourcePickerField` needs to render a badge, fetching each id individually
   * through `RequestStore` (`resource.single`) — the `race`/`roles` constant-mode fields don't
   * need this, since their names are derived purely from the raw value via `translateOption`.
   * An id that fails to resolve (e.g. a deleted `source`/`collection`) is silently dropped.
   *
   * @param {string} resource - Resource name (`'source'` or `'collection'`).
   * @param {string[]} ids - Raw ids to resolve, as read from the hash.
   * @returns {Promise<{id: number, name: string}[]>} Resolves to the successfully resolved picks.
   */
  static resolveResourcePicks(resource, ids) {
    return Promise.all(ids.map((id) => RequestStore.ensure({
      componentName: 'StlModelFiltersController', resource, quantityType: 'single', params: { id },
    })
      .then(({ data }) => ({ id: data.id, name: data.name }))
      .catch(() => null))).then((picks) => picks.filter((pick) => pick !== null));
  }

  /**
   * Resolve `ids` (when any) through {@link StlModelFiltersController.resolveResourcePicks} and
   * apply the result via `setter` — a no-op, without firing a request, when `ids` is empty.
   *
   * @param {string} resource - Resource name (`'source'` or `'collection'`).
   * @param {string[]} ids - Raw ids to resolve, as read from the hash.
   * @param {Function} setter - State setter to apply the resolved picks to.
   * @returns {Promise<void>} Resolves once the picks have been applied (or immediately, when
   *   `ids` is empty).
   */
  static loadResourcePicks(resource, ids, setter) {
    if (ids.length === 0) {
      return Promise.resolve();
    }

    return StlModelFiltersController.resolveResourcePicks(resource, ids).then(setter);
  }

  /**
   * Handles a Name field change, updating the draft state.
   *
   * @param {string} value - newly typed name value.
   * @returns {void}
   */
  handleNameChange(value) {
    this.setName(value);
  }

  /**
   * Handles a Type dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected type value.
   * @returns {void}
   */
  handleTypeChange(value) {
    this.setType(value);
  }

  /**
   * Handles a Size dropdown change, updating the draft state.
   *
   * @param {string} value - newly selected size value.
   * @returns {void}
   */
  handleSizeChange(value) {
    this.setSize(value);
  }

  /**
   * Handles a Races picker change, updating the draft state.
   *
   * @param {{id: string, name: string}[]} value - newly picked races.
   * @returns {void}
   */
  handleRacesChange(value) {
    this.setRaces(value);
  }

  /**
   * Handles a Roles picker change, updating the draft state.
   *
   * @param {{id: string, name: string}[]} value - newly picked roles.
   * @returns {void}
   */
  handleRolesChange(value) {
    this.setRoles(value);
  }

  /**
   * Handles a Sources picker change, updating the draft state.
   *
   * @param {{id: number, name: string}[]} value - newly picked sources.
   * @returns {void}
   */
  handleSourcesChange(value) {
    this.setSources(value);
  }

  /**
   * Handles a Collections picker change, updating the draft state.
   *
   * @param {{id: number, name: string}[]} value - newly picked collections.
   * @returns {void}
   */
  handleCollectionsChange(value) {
    this.setCollections(value);
  }

  /**
   * Splits/trims/de-duplicates the raw tags text input (mirroring `StlModelNew.jsx`'s own tags
   * field) and appends the result to the draft tags state.
   *
   * @param {string[]} tags - Current draft tags list.
   * @param {string} tagInput - Raw comma-separated input value.
   * @returns {void}
   */
  addTag(tags, tagInput) {
    this.setTags(buildTagsAfterAdd(tags, tagInput));
  }

  /**
   * Removes a single tag from the draft tags state.
   *
   * @param {string[]} tags - Current draft tags list.
   * @param {string} tag - Tag to remove.
   * @returns {void}
   */
  removeTag(tags, tag) {
    this.setTags(tags.filter((t) => t !== tag));
  }

  /**
   * Builds the query object for the Query button, omitting blank/empty fields.
   *
   * @param {string} name - current Name field value.
   * @param {string} type - current Type dropdown value.
   * @param {string} size - current Size dropdown value.
   * @param {{id: string, name: string}[]} races - current draft races picks.
   * @param {{id: string, name: string}[]} roles - current draft roles picks.
   * @param {{id: number, name: string}[]} sources - current draft sources picks.
   * @param {{id: number, name: string}[]} collections - current draft collections picks.
   * @param {string[]} tags - current draft tags.
   * @returns {{name: string, type: string, size: string, race: string[], roles: string[],
   *   source: number[], collection: number[], tags: string[]}} query params to apply, with
   *   blank/empty fields omitted.
   */
  buildQuery(name, type, size, races, roles, sources, collections, tags) {
    return buildFilterQuery([
      ['name', name.trim()],
      ['type', type],
      ['size', size],
      ['race', races.map((race) => race.id)],
      ['roles', roles.map((role) => role.id)],
      ['source', sources.map((source) => source.id)],
      ['collection', collections.map((collection) => collection.id)],
      ['tags', tags],
    ]);
  }

  /**
   * Resets all draft fields to blank/empty.
   *
   * @returns {void}
   */
  clear() {
    this.setName('');
    this.setType('');
    this.setSize('');
    this.setRaces([]);
    this.setRoles([]);
    this.setSources([]);
    this.setCollections([]);
    this.setTags([]);
  }
}
