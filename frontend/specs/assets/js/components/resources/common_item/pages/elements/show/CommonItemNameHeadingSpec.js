import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemNameHeading
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemNameHeading.jsx';

describe('CommonItemNameHeading', function() {
  it('renders the common item name as the heading', function() {
    expect(renderToStaticMarkup(CommonItemNameHeading({ name: 'Healing Potion' })))
      .toBe('<h1>Healing Potion</h1>');
  });
});
