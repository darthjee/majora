import { renderToStaticMarkup } from 'react-dom/server';
import CharacterDocumentNameHeading
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterDocumentNameHeading.jsx';

describe('CharacterDocumentNameHeading', function() {
  it('renders the document name as the heading', function() {
    expect(renderToStaticMarkup(CharacterDocumentNameHeading({ name: 'Ancient Tome' })))
      .toBe('<h1>Ancient Tome</h1>');
  });
});
