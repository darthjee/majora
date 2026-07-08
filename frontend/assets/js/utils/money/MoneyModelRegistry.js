const models = new Map();

/**
 * Static registry mapping currency model names (e.g. `dnd`) to their model
 * classes, so display components can resolve a currency model by name
 * without depending on the model's implementation directly.
 */
export default class MoneyModelRegistry {
  /**
   * Register a money model class under a given name.
   *
   * @param {string} name - Money model name (e.g. `dnd`).
   * @param {Function} modelClass - Model class to register.
   * @returns {void}
   */
  static register(name, modelClass) {
    models.set(name, modelClass);
  }

  /**
   * Resolve a previously registered money model class by name.
   *
   * @param {string} name - Money model name (e.g. `dnd`).
   * @returns {Function} The registered model class.
   */
  static resolve(name) {
    const modelClass = models.get(name);

    if (!modelClass) {
      throw new Error(`Unknown money model: ${name}`);
    }

    return modelClass;
  }
}
