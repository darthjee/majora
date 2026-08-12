import { renderToStaticMarkup } from 'react-dom/server';
import FactionNameHeading
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/show/FactionNameHeading.jsx';

describe('FactionNameHeading', function() {
  it('renders the faction name as the heading', function() {
    expect(renderToStaticMarkup(FactionNameHeading({ name: 'The Silver Hand' })))
      .toBe('<h1>The Silver Hand</h1>');
  });
});
