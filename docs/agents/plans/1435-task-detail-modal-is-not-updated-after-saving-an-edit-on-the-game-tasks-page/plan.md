# Plan: Task detail modal is not updated after saving an edit on the game Tasks page


Issue: [1435-task-detail-modal-is-not-updated-after-saving-an-edit-on-the-game-tasks-page.md](../../issues/1435-task-detail-modal-is-not-updated-after-saving-an-edit-on-the-game-tasks-page.md)

## Overview

Frontend-only fix. After a successful save, the Tasks page replaces `selectedTask` with the updated
task, so the modal shows it. The modal awaits the save and stays in edit mode with an error when
the save fails. It also disables Save/Cancel (with a "Saving…" label) while the request is in
flight.

See [frontend.md](frontend.md) for the full plan.
