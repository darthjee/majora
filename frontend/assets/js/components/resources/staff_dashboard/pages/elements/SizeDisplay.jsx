import React from 'react';
import UnitConverters from './units/UnitConverters.js';

/**
 * Renders a raw `value` converted to its best-fit unit (resolved via
 * `UnitConverters` for the given `valueType`), with no percentage/bar —
 * unlike `MetricDisplay`, which requires a `limit` to render one.
 *
 * @param {object} props - Component props.
 * @param {number} props.value - Raw value.
 * @param {string} props.valueType - Value type used to resolve the unit converter (e.g. `bytes`).
 * @returns {React.ReactElement} The rendered value.
 */
export default function SizeDisplay({ value, valueType }) {
  const converter = UnitConverters.forType(valueType);
  const converted = converter.convert(value);

  return <span>{`${UnitConverters.formatValue(converted.value)} ${converted.unit}`}</span>;
}
