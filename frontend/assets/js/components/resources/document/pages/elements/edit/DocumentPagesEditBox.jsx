import {
  forwardRef, useImperativeHandle, useMemo, useState,
} from 'react';
import DocumentPagesEditBoxController from './controllers/DocumentPagesEditBoxController.js';
import DocumentPagesEditBoxHelper from './helpers/DocumentPagesEditBoxHelper.jsx';

const INITIAL_STATE = { editMode: false, loading: false, value: '' };

/**
 * Self-contained pages editor for the game document edit page (issue #1129): owns its own
 * opt-in "pages edit mode" (mirroring how `DocumentPagesBoxController` already owns all of the
 * show page box's state), an infinite `MarkdownEditor` textarea seeded from the document's full
 * current content once edit mode is entered, and a live "total pages" blind-estimate counter.
 * Read-only (just an "Edit" affordance) by default; "Cancel" discards in-progress textarea
 * changes and exits edit mode without touching anything else.
 *
 * Exposes a single imperative `save()` entry point (via `forwardRef`/`useImperativeHandle`) that
 * `GameDocumentEdit`'s own save handler calls unconditionally, regardless of whether pages edit
 * mode was ever entered — see {@link DocumentPagesEditBoxController#save}.
 *
 * @param {object} props - Component props.
 * @param {string} props.gameSlug - Game slug the document belongs to.
 * @param {number|string} props.id - `GameDocument` id.
 * @param {boolean} [props.canEditPages] - Whether the current user may edit this document's
 *   pages; the "Edit" affordance renders only when true.
 * @param {React.Ref} ref - Imperative handle ref, exposing `save()`.
 * @returns {React.ReactElement|null} The pages editor element, or `null` while read-only and the
 *   caller has no edit permission.
 */
function DocumentPagesEditBox({ gameSlug, id, canEditPages = false }, ref) {
  const [state, setState] = useState(INITIAL_STATE);
  const controller = useMemo(
    () => new DocumentPagesEditBoxController(gameSlug, id),
    [gameSlug, id],
  );

  useImperativeHandle(ref, () => ({
    save: () => controller.save(state.value, state.editMode).then((result) => {
      if (result.ok) {
        setState(INITIAL_STATE);
      }

      return result;
    }),
  }), [controller, state.value, state.editMode]);

  const handleEdit = () => {
    setState((previous) => ({ ...previous, loading: true }));
    controller.loadAllPages().then(({ content }) => {
      setState({ editMode: true, loading: false, value: content });
    });
  };

  const handleCancel = () => setState(INITIAL_STATE);
  const handleChange = (event) => setState((previous) => ({ ...previous, value: event.target.value }));

  return DocumentPagesEditBoxHelper.render(
    state,
    canEditPages,
    { onEdit: handleEdit, onCancel: handleCancel, onChange: handleChange },
    gameSlug,
    id,
  );
}

export default forwardRef(DocumentPagesEditBox);
