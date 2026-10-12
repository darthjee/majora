import staffCopyErrorKey from '../helpers/StaffCopyErrors.js';

/**
 * Sequential copy runner of the staff copy page (issue #1571).
 *
 * @description Copies the given rows strictly one at a time and, for every copied row, links
 *   its files one at a time. A failure never stops the run. Progress is published through
 *   `onChange` as an immutable run snapshot:
 *   `{running, total, done, entities: [{id, name, status, reason, links}]}`, where an entity
 *   `status` is `pending → copying → copied | failed` (`reason` holding the
 *   `staff_copies_page.entity_error.*` key on failure) and each link carries its own
 *   `status` (`pending → linking → linked | failed`).
 */
export default class StaffCopyRunner {
  /**
   * Create a runner.
   *
   * @param {import('./StaffCopyActions.js').default} actions - Outcome-returning actions.
   * @param {Function} onChange - Called with every new run snapshot.
   */
  constructor(actions, onChange) {
    this.actions = actions;
    this.onChange = onChange;
    this.state = null;
  }

  /**
   * Run the copy of every row.
   *
   * @param {string} copyType - Copy type slug.
   * @param {string} target - Target game slug.
   * @param {{id: number, name: string}[]} rows - Rows to copy.
   * @returns {Promise<object>} Resolves to the final run snapshot.
   */
  async run(copyType, target, rows) {
    this.#update({
      running: true,
      total: rows.length,
      done: 0,
      entities: rows.map(({ id, name }) => ({
        id, name, status: 'pending', reason: null, links: [],
      })),
    });

    for (const [index, row] of rows.entries()) {
      await this.#copyEntity(copyType, target, row, index);
      this.#update({ ...this.state, done: index + 1 });
    }

    this.#update({ ...this.state, running: false });

    return this.state;
  }

  async #copyEntity(copyType, target, row, index) {
    this.#patchEntity(index, { status: 'copying' });

    const { ok, status, data } = await this.actions.copy(copyType, row.id, target);

    if (!ok) {
      this.#patchEntity(index, { status: 'failed', reason: staffCopyErrorKey(status) });
      return;
    }

    const links = (data?.links ?? []).map((link) => ({ ...link, status: 'pending' }));

    this.#patchEntity(index, { status: 'copied', links });

    for (const [linkIndex, link] of links.entries()) {
      await this.#linkFile(index, linkIndex, link);
    }
  }

  async #linkFile(index, linkIndex, link) {
    this.#patchLink(index, linkIndex, { status: 'linking' });

    const { ok } = await this.actions.link(link);

    this.#patchLink(index, linkIndex, { status: ok ? 'linked' : 'failed' });
  }

  #patchEntity(index, patch) {
    const entities = this.state.entities.map((entity, position) => (
      position === index ? { ...entity, ...patch } : entity
    ));

    this.#update({ ...this.state, entities });
  }

  #patchLink(index, linkIndex, patch) {
    const links = this.state.entities[index].links.map((link, position) => (
      position === linkIndex ? { ...link, ...patch } : link
    ));

    this.#patchEntity(index, { links });
  }

  #update(state) {
    this.state = state;
    this.onChange(state);
  }
}
