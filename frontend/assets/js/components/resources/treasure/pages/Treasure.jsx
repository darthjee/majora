import { useEffect, useMemo, useState } from 'react';
import TreasureController from './controllers/TreasureController.js';
import TreasureHelper from './helpers/TreasureHelper.jsx';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';

/**
 * Treasure detail page.
 *
 * @returns {React.ReactElement} Treasure detail page element.
 */
export default function Treasure() {
  const [treasure, setTreasure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new TreasureController(setTreasure, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  if (loading) return TreasureHelper.renderLoading();
  if (error) return TreasureHelper.renderError(error);
  return TreasureHelper.render(treasure);
}
