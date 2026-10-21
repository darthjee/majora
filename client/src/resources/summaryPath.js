import { UsageError } from '../core/errors/UsageError.js';
import { encodeSegment } from './Resource.js';

/**
 * Character families a summary can be read for.
 * @type {string[]}
 */
export const SUMMARY_KINDS = ['pcs', 'npcs'];

/**
 * Variant map entry of the `summary` action. `pathFor` only resolves `:id`, so the
 * `/<kind>/<character_id>/summary[/all]` suffix is appended by `summaryPath`.
 * @type {{regular: string, restricted: string}}
 */
export const SUMMARY_VARIANT = { regular: ':id', restricted: ':id' };

/**
 * Builds the path of a per-character summary
 * (`<family>/<id>/<pcs|npcs>/<character_id>/summary`, `/summary/all` when restricted).
 * @param {import('./Resource.js').Resource} resource - The linked family wrapper (`Items`,
 *   `Documents` or `Factions`), whose variant map has a `summary` entry.
 * @param {string|number} id - The record id (item, document or faction).
 * @param {string} kind - The character family: `'pcs'` or `'npcs'`.
 * @param {string|number} characterId - The character id.
 * @param {boolean} [restricted] - Select the restricted variant.
 * @returns {string} The path, relative to `baseUrl` and without `.json`.
 * @throws {UsageError} When `kind` is not `'pcs'` / `'npcs'`, an id is blank, or the
 *   resource has no `summary` variant.
 */
export function summaryPath(resource, id, kind, characterId, restricted = false) {
  if (!SUMMARY_KINDS.includes(kind)) {
    throw new UsageError(`Invalid character kind: expected one of ${SUMMARY_KINDS.join(', ')}`);
  }

  const base = resource.pathFor('summary', { restricted, id });
  const character = encodeSegment(characterId, 'character id');
  const suffix = restricted ? 'summary/all' : 'summary';

  return `${base}/${kind}/${character}/${suffix}`;
}

/**
 * Fetches a per-character summary (`GET`), returning the parsed body.
 * @param {import('./Resource.js').Resource} resource - The linked family wrapper.
 * @param {string|number} id - The record id.
 * @param {string} kind - `'pcs'` or `'npcs'`.
 * @param {string|number} characterId - The character id.
 * @param {object} [options] - Request options; `restricted` selects the `/all` variant.
 * @returns {Promise<unknown>} The parsed body.
 * @throws {UsageError} See `summaryPath`.
 */
export async function fetchSummary(resource, id, kind, characterId, options = {}) {
  const { restricted, ...rest } = options;
  const path = summaryPath(resource, id, kind, characterId, restricted);
  const { body } = await resource.http.get(path, rest);

  return body;
}
