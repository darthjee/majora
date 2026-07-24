import { renderToStaticMarkup } from 'react-dom/server';
import DocumentNameHeading
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentNameHeading.jsx';

describe('DocumentNameHeading', function() {
  it('renders the document name as the heading', function() {
    expect(renderToStaticMarkup(DocumentNameHeading({ name: 'Ancient Scroll' })))
      .toBe('<h1>Ancient Scroll</h1>');
  });
});
