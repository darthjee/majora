import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemFiltersHelper
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/helpers/CommonItemFiltersHelper.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

describe('CommonItemFiltersHelper', function() {
  describe('.render', function() {
    const handlers = {
      onNameChange: Noop.noop,
      onCategoryChange: Noop.noop,
      onMinPriceChange: Noop.noop,
      onMaxPriceChange: Noop.noop,
      onQuery: Noop.noop,
      onClear: Noop.noop,
    };
    const blank = {
      name: '', category: '', minPrice: '', maxPrice: '',
    };

    it('renders the fields and the query and clear buttons', function() {
      const html = renderToStaticMarkup(CommonItemFiltersHelper.render(blank, handlers));

      expect(html).toContain('data-testid="common-item-filters"');
      expect(html).toContain('data-testid="common-item-filter-name"');
      expect(html).toContain('data-testid="common-item-filter-category"');
      expect(html).toContain('data-testid="common-item-filter-min-price"');
      expect(html).toContain('data-testid="common-item-filter-max-price"');
      expect(html).toContain('data-testid="common-item-filter-query"');
      expect(html).toContain('data-testid="common-item-filter-clear"');
    });

    it('renders the blank option plus every category option', function() {
      const html = renderToStaticMarkup(CommonItemFiltersHelper.render(blank, handlers));

      expect(html.match(/<option /g).length).toBe(9);
      expect(html).toContain('>All</option>');
    });

    it('renders price inputs as non-negative integer numbers', function() {
      const html = renderToStaticMarkup(CommonItemFiltersHelper.render(blank, handlers));

      expect(html.match(/type="number"/g).length).toBe(2);
      expect(html.match(/min="0"/g).length).toBe(2);
      expect(html.match(/step="1"/g).length).toBe(2);
    });

    it('renders the current draft values', function() {
      const html = renderToStaticMarkup(CommonItemFiltersHelper.render({
        name: 'rope', category: 'tool', minPrice: '10', maxPrice: '99',
      }, handlers));

      expect(html).toContain('value="rope"');
      expect(html).toContain('value="10"');
      expect(html).toContain('value="99"');
    });

    it('queries when Enter is pressed in an input', function() {
      const onQuery = jasmine.createSpy('onQuery');
      const element = CommonItemFiltersHelper.render(blank, { ...handlers, onQuery });
      const preventDefault = jasmine.createSpy('preventDefault');

      element.props.onKeyDown({ key: 'Enter', target: { tagName: 'INPUT' }, preventDefault });

      expect(onQuery).toHaveBeenCalledTimes(1);
    });

    it('does not query on other keys or non-input targets', function() {
      const onQuery = jasmine.createSpy('onQuery');
      const element = CommonItemFiltersHelper.render(blank, { ...handlers, onQuery });
      const preventDefault = jasmine.createSpy('preventDefault');

      element.props.onKeyDown({ key: 'a', target: { tagName: 'INPUT' }, preventDefault });
      element.props.onKeyDown({ key: 'Enter', target: { tagName: 'BUTTON' }, preventDefault });

      expect(onQuery).not.toHaveBeenCalled();
    });
  });
});
