/**
 * Resolve which `resourceConfig` variant (`regular` or `private`) applies for a given
 * permissions object, shared by {@link Request#ensure} and {@link RequestStore.mutate} so both
 * pick a resource's `GET`/mutation path the same way.
 *
 * @param {{regular: object, private: object}} config - The resolved `resourceConfig` entry
 *   (its `regular`/`private` `{ path, permission }` pair) for a resource/method/quantity-type.
 * @param {object} permissions - Currently-granted permissions object (e.g. `{ can_edit: true }`).
 * @param {object} params - Concrete params, passed to `permission` when it is a function.
 * @returns {{path: Function, permission: (string|Function|null), name: string}} The chosen
 *   variant, tagged with its own `name` (`'regular'` or `'private'`).
 */
export default function resolveVariant(config, permissions, params) {
  const { regular, private: privateEntry } = config;
  const permissionKey = typeof privateEntry.permission === 'function'
    ? privateEntry.permission(params)
    : privateEntry.permission;
  const granted = permissionKey !== null && permissionKey !== undefined && permissions?.[permissionKey] === true;

  return granted ? { ...privateEntry, name: 'private' } : { ...regular, name: 'regular' };
}
