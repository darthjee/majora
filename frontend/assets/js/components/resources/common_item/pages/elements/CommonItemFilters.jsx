import { useState } from 'react';
import CommonItemFiltersController from './controllers/CommonItemFiltersController.js';
import CommonItemFiltersHelper from './helpers/CommonItemFiltersHelper.jsx';
import HashRouteResolver from '../../../../../utils/routing/HashRouteResolver.js';

/**
 * Filter bar rendered above the game common items list, with Name, Category, Min price and
 * Max price fields plus Query and Clear buttons. Draft fields are pre-populated from the
 * current hash's `name`/`category`/`min_price`/`max_price` params. Pressing Enter in a field
 * triggers the query.
 *
 * @param {object} props - Component props.
 * @param {Function} props.onQuery - Called with the built query object (blank fields omitted)
 *   when Query is clicked or Enter is pressed.
 * @param {Function} props.onClear - Called after the draft fields were reset, when Clear is
 *   clicked.
 * @returns {React.ReactElement} rendered common item filters bar.
 */
export default function CommonItemFilters({ onQuery, onClear }) {
  const initialFilters = new HashRouteResolver().getFilterParams();
  const [name, setName] = useState(initialFilters.get('name') ?? '');
  const [category, setCategory] = useState(initialFilters.get('category') ?? '');
  const [minPrice, setMinPrice] = useState(initialFilters.get('min_price') ?? '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.get('max_price') ?? '');

  const controller = new CommonItemFiltersController(setName, setCategory, setMinPrice, setMaxPrice);

  const handleQuery = () => {
    onQuery(controller.buildQuery(name, category, minPrice, maxPrice));
  };

  const handleClear = () => {
    controller.clear();
    onClear();
  };

  return CommonItemFiltersHelper.render(
    {
      name, category, minPrice, maxPrice,
    },
    {
      onNameChange: (value) => controller.handleNameChange(value),
      onCategoryChange: (value) => controller.handleCategoryChange(value),
      onMinPriceChange: (value) => controller.handleMinPriceChange(value),
      onMaxPriceChange: (value) => controller.handleMaxPriceChange(value),
      onQuery: handleQuery,
      onClear: handleClear,
    },
  );
}
