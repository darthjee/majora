import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemPriceField
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemPriceField.jsx';

describe('CommonItemPriceField', function() {
  describe('.Show', function() {
    it('renders the price via TreasureMoney', function() {
      const html = renderToStaticMarkup(CommonItemPriceField.Show({ price: 500 }));

      expect(html).toContain('5 GP');
    });

    it('defaults to 0 when price is missing', function() {
      const html = renderToStaticMarkup(CommonItemPriceField.Show({}));

      expect(html).toContain('0 GP');
    });
  });

  describe('.New / .Edit', function() {
    const buildProps = (overrides = {}) => ({
      mode: 'new',
      price: '500',
      fieldErrors: {},
      handlers: { onOpenPriceModal: jasmine.createSpy('onOpenPriceModal') },
      ...overrides,
    });

    it('renders the collapsed price via TreasureMoney', function() {
      const html = renderToStaticMarkup(CommonItemPriceField.New(buildProps()));

      expect(html).toContain('5 GP');
    });

    it('scopes the label to edit mode', function() {
      const html = renderToStaticMarkup(CommonItemPriceField.Edit(buildProps({ mode: 'edit' })));

      expect(html).toContain('Price');
    });

    it('wires the edit button to handlers.onOpenPriceModal', function() {
      const handlers = { onOpenPriceModal: jasmine.createSpy('onOpenPriceModal') };
      const element = CommonItemPriceField.New(buildProps({ handlers }));
      const button = element.props.children[2];

      button.props.onClick();

      expect(handlers.onOpenPriceModal).toHaveBeenCalled();
    });

    it('renders field errors for the price field', function() {
      const html = renderToStaticMarkup(
        CommonItemPriceField.New(buildProps({ fieldErrors: { price: ['must be positive'] } })),
      );

      expect(html).toContain('must be positive');
    });
  });
});
