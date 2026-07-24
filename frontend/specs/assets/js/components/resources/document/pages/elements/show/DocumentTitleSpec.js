import { renderToStaticMarkup } from 'react-dom/server';
import DocumentTitle
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentTitle.jsx';

describe('DocumentTitle', function() {
  it('renders the create-document title', function() {
    const html = renderToStaticMarkup(DocumentTitle({ status: 'idle' }));

    expect(html).toContain('Create Document');
  });

  it('renders an error alert when status is error', function() {
    const html = renderToStaticMarkup(DocumentTitle({ status: 'error' }));

    expect(html).toContain('Failed to create document. Please try again.');
  });

  it('renders no error alert when status is idle', function() {
    const html = renderToStaticMarkup(DocumentTitle({ status: 'idle' }));

    expect(html).not.toContain('alert');
  });
});
