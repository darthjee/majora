import { useEffect, useMemo, useState } from 'react';
import StlModelController from './controllers/StlModelController.js';
import StlModelHelper from './helpers/StlModelHelper.jsx';
import FacadeRefresh from '../../../../utils/access/useFacadeRefresh.js';

/**
 * STL model detail page.
 *
 * @returns {React.ReactElement} STL model detail page element.
 */
export default function StlModel() {
  const [stlModel, setStlModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const controller = useMemo(
    () => new StlModelController(setStlModel, setLoading, setError),
    [],
  );

  useEffect(() => controller.buildEffect()(), [controller]);
  FacadeRefresh.useFacadeRefresh(controller);

  if (loading) return StlModelHelper.renderLoading();
  if (error) return StlModelHelper.renderError(error);
  return StlModelHelper.render(stlModel);
}
