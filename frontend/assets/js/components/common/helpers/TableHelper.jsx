import React from 'react';

/**
 * Rendering helper for the generic Table element.
 */
export default class TableHelper {
  /**
   * Render a table from columns, rows, and an optional per-row actions renderer.
   *
   * @param {{key: string, label: string}[]} columns - Column definitions.
   * @param {object[]} rows - Row data objects, keyed by `column.key`.
   * @param {Function} [renderActions] - Optional per-row actions renderer.
   * @returns {React.ReactElement} Table element.
   */
  static render(columns, rows, renderActions) {
    return (
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
            {renderActions ? <th /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => TableHelper.#renderRow(row, index, columns, renderActions))}
        </tbody>
      </table>
    );
  }

  /**
   * Render a single table row.
   *
   * @param {object} row - Row data object.
   * @param {number} index - Row index, used as a fallback React key.
   * @param {{key: string, label: string}[]} columns - Column definitions.
   * @param {Function} [renderActions] - Optional per-row actions renderer.
   * @returns {React.ReactElement} Table row element.
   */
  static #renderRow(row, index, columns, renderActions) {
    return (
      <tr key={row.id ?? index}>
        {columns.map((column) => <td key={column.key}>{row[column.key]}</td>)}
        {renderActions ? <td>{renderActions(row)}</td> : null}
      </tr>
    );
  }
}
