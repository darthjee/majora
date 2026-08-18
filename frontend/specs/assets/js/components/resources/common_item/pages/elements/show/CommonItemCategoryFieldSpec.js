import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemCategoryField, { CATEGORY_VALUES }
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemCategoryField.jsx';

describe('CommonItemCategoryField', function() {
  describe('CATEGORY_VALUES', function() {
    it('lists the 7 fixed category values', function() {
      expect(CATEGORY_VALUES).toEqual([
        'potion', 'drug', 'consumable', 'ammunition', 'poison', 'gear', 'other',
      ]);
    });
  });

  describe('.Show', function() {
    it("renders the category's translated label", function() {
      const html = renderToStaticMarkup(CommonItemCategoryField.Show({ category: 'potion' }));

      expect(html).toContain('Potion');
    });

    it('defaults to the "other" category label when category is missing', function() {
      const html = renderToStaticMarkup(CommonItemCategoryField.Show({}));

      expect(html).toContain('Other');
    });
  });

  describe('.New / .Edit', function() {
    const buildProps = (overrides = {}) => ({
      mode: 'new',
      category: 'potion',
      handlers: { onCategoryChange: jasmine.createSpy('onCategoryChange') },
      ...overrides,
    });

    it('renders a select with a mode-scoped id in new mode', function() {
      const html = renderToStaticMarkup(CommonItemCategoryField.New(buildProps()));

      expect(html).toContain('id="common-item-new-category"');
    });

    it('scopes the id to edit mode', function() {
      const html = renderToStaticMarkup(CommonItemCategoryField.Edit(buildProps({ mode: 'edit' })));

      expect(html).toContain('id="common-item-edit-category"');
    });

    it('renders an option for every category value', function() {
      const html = renderToStaticMarkup(CommonItemCategoryField.New(buildProps()));

      CATEGORY_VALUES.forEach((value) => {
        expect(html).toContain(`value="${value}"`);
      });
    });

    it('wires onChange to handlers.onCategoryChange', function() {
      const handlers = { onCategoryChange: jasmine.createSpy('onCategoryChange') };
      const element = CommonItemCategoryField.New(buildProps({ handlers }));
      const select = element.props.children[1];

      expect(select.props.onChange).toBe(handlers.onCategoryChange);
    });

    it('selects the current category value', function() {
      const element = CommonItemCategoryField.New(buildProps({ category: 'gear' }));
      const select = element.props.children[1];

      expect(select.props.value).toBe('gear');
    });
  });
});
