import { renderToStaticMarkup } from 'react-dom/server';
import ItemNameHeading
  from '../../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemNameHeading.jsx';

describe('ItemNameHeading', function() {
  it('renders the item name as the heading', function() {
    expect(renderToStaticMarkup(ItemNameHeading({ name: 'Cloak of Elvenkind' })))
      .toBe('<h1>Cloak of Elvenkind</h1>');
  });
});
