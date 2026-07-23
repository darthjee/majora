import React from 'react';
import PercentageThresholds from './PercentageThresholds.js';

const LEVEL_CLASS_NAME = {
  ok: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  overlimit: 'text-overlimit',
};

/**
 * Renders `value / limit` as a color-coded percentage (which can exceed 100%),
 * the color level resolved via `PercentageThresholds`.
 *
 * @param {object} props - Component props.
 * @param {number} props.value - Raw value.
 * @param {number} props.limit - Raw limit `value` is measured against.
 * @param {number[]} [props.thresholds] - Raw color thresholds, see `PercentageThresholds`.
 * @returns {React.ReactElement} The rendered percentage.
 */
export default function PercentageDisplay({ value, limit, thresholds }) {
  const percentage = limit > 0 ? value / limit : 0;
  const level = PercentageThresholds.levelFor(percentage, thresholds);

  return (
    <span className={LEVEL_CLASS_NAME[level]}>
      {Math.round(percentage * 100)}%
    </span>
  );
}
