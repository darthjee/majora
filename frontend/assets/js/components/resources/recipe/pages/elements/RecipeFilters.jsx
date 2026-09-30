import { useMemo, useState } from 'react';
import RecipeFiltersController from './controllers/RecipeFiltersController.js';
import RecipeFiltersHelper from './helpers/RecipeFiltersHelper.jsx';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Category filter bar rendered above the game recipes list (issue #1449). The selection is
 * pre-populated from the current hash's `category` param (unknown values start as "all") and is
 * applied as soon as it changes.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onQuery - Called with the built `{category}` query object (empty for
 *   "all") whenever the selection changes.
 * @returns {React.ReactElement} Rendered recipe filters bar.
 */
export default function RecipeFilters({ onQuery }) {
  const [category, setCategory] = useState(
    () => RecipeFiltersController.categoryFromParams(new HashRouteResolver().getFilterParams()),
  );

  const controller = useMemo(() => new RecipeFiltersController(setCategory, onQuery), [onQuery]);

  return RecipeFiltersHelper.render(
    { category },
    { onCategoryChange: (value) => controller.handleCategoryChange(value) },
  );
}
