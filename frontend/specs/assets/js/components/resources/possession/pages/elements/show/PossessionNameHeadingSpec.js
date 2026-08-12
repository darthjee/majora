import { renderToStaticMarkup } from 'react-dom/server';
import PossessionNameHeading
  from '../../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionNameHeading.jsx';

describe('PossessionNameHeading', function() {
  it('renders the possession name as the heading', function() {
    expect(renderToStaticMarkup(PossessionNameHeading({ name: 'Old Tavern' })))
      .toBe('<h1>Old Tavern</h1>');
  });
});
