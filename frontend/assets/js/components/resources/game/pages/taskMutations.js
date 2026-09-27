import RequestStore from '../../../../utils/requests/RequestStore.js';

/**
 * Replace the task with the given id in a tasks list.
 *
 * @param {object[]} tasks - Current tasks list.
 * @param {number} id - Id of the task to replace.
 * @param {object} updatedTask - Replacement task.
 * @returns {object[]} New tasks list.
 */
function replaceTask(tasks, id, updatedTask) {
  return tasks.map((item) => (item.id === id ? updatedTask : item));
}

/**
 * Send a PATCH request for a single task of a game.
 *
 * @param {string} componentName - Name of the calling component, forwarded to `RequestStore`.
 * @param {string} gameSlug - Game slug.
 * @param {number} id - Task id.
 * @param {object} body - Request body.
 * @returns {Promise<Response>} Mutation response.
 */
function patchTask(componentName, gameSlug, id, body) {
  return RequestStore.mutate({
    componentName,
    resource: 'task',
    method: 'PATCH',
    quantityType: 'single',
    params: { gameSlug, id },
    body,
  });
}

/**
 * Toggles a task's `completed` flag, updating local state immediately and
 * rolling back when the request fails.
 *
 * @param {string} componentName - Name of the calling component, forwarded to `RequestStore`.
 * @param {string} gameSlug - Game slug.
 * @param {object} task - Task to toggle.
 * @param {object[]} tasks - Current tasks list.
 * @param {Function} setTasks - Tasks setter.
 * @returns {Promise<void>} Resolves when the request handling finishes.
 */
export async function toggleTaskCompleted(componentName, gameSlug, task, tasks, setTasks) {
  const nextCompleted = !task.completed;

  setTasks(replaceTask(tasks, task.id, { ...task, completed: nextCompleted }));

  try {
    const response = await patchTask(componentName, gameSlug, task.id, { completed: nextCompleted });

    if (!response.ok) {
      setTasks(tasks);
      return;
    }

    const data = await response.json();
    setTasks(replaceTask(tasks, task.id, data));
  } catch {
    setTasks(tasks);
  }
}

/**
 * Saves edits to a task's category, session and short/long description.
 *
 * @param {string} componentName - Name of the calling component, forwarded to `RequestStore`.
 * @param {string} gameSlug - Game slug.
 * @param {object} task - Task being edited.
 * @param {{category: string, session: ({id: number}|null), shortDescription: string,
 *   longDescription: string}} formValues - Edited values; `category` is the raw category value
 *   (e.g. `'painting'`) and `session` the picked session item (sent as its id), or null.
 * @param {object[]} tasks - Current tasks list.
 * @param {Function} setTasks - Tasks setter.
 * @returns {Promise<object|null>} The updated task on success, or null on failure.
 */
export async function saveTaskEdit(componentName, gameSlug, task, formValues, tasks, setTasks) {
  try {
    const response = await patchTask(componentName, gameSlug, task.id, {
      category: formValues.category,
      session: formValues.session?.id ?? null,
      short_description: formValues.shortDescription,
      long_description: formValues.longDescription,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    setTasks(replaceTask(tasks, task.id, data));
    return data;
  } catch {
    return null;
  }
}
