import React from 'react';
import PercentageThresholds from './PercentageThresholds.js';
import UnitConverters from './units/UnitConverters.js';

const LEVEL_CLASS_NAME = {
  ok: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  overlimit: 'text-overlimit',
};

/**
 * Renders `value / limit` as a color-coded percentage (which can exceed 100%),
 * the color level resolved via `PercentageThresholds`, plus a second line with
 * the converted `value` and `limit` and their unit, resolved via
 * `UnitConverters` for the given `valueType`.
 *
 * @param {object} props - Component props.
 * @param {number} props.value - Raw value.
 * @param {number} props.limit - Raw limit `value` is measured against.
 * @param {string} props.valueType - Value type used to resolve the unit converter (e.g. `bytes`).
 * @param {number[]} [props.thresholds] - Raw color thresholds, see `PercentageThresholds`.
 * @returns {React.ReactElement} The rendered metric.
 */
export default function MetricDisplay({ value, limit, valueType, thresholds }) {
  const percentage = limit > 0 ? value / limit : 0;
  const level = PercentageThresholds.levelFor(percentage, thresholds);

  return (
    <span className={LEVEL_CLASS_NAME[level]}>
      {Math.round(percentage * 100)}%
      <br />
      {renderValueLimitLine(value, limit, valueType)}
    </span>
  );
}

/**
 * Build the `<converted value> <unit> / <converted limit> <unit>` line.
 *
 * @param {number} value - Raw value.
 * @param {number} limit - Raw limit.
 * @param {string} valueType - Value type used to resolve the unit converter.
 * @returns {string} The formatted value/limit line.
 */
function renderValueLimitLine(value, limit, valueType) {
  const converter = UnitConverters.forType(valueType);
  const convertedValue = converter.convert(value);
  const convertedLimit = converter.convert(limit);

  return `${UnitConverters.formatValue(convertedValue.value)} ${convertedValue.unit} / `
    + `${UnitConverters.formatValue(convertedLimit.value)} ${convertedLimit.unit}`;
}
