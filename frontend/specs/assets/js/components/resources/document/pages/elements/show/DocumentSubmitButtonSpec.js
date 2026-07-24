import { renderToStaticMarkup } from 'react-dom/server';
import DocumentSubmitButton
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentSubmitButton.jsx';

describe('DocumentSubmitButton', function() {
  it('renders the create-document label', function() {
    const html = renderToStaticMarkup(DocumentSubmitButton({ status: 'idle' }));

    expect(html).toContain('Create Document');
  });

  it('disables the button while submitting', function() {
    const html = renderToStaticMarkup(DocumentSubmitButton({ status: 'submitting' }));

    expect(html).toContain('disabled=""');
  });

  it('does not disable the button when idle', function() {
    const html = renderToStaticMarkup(DocumentSubmitButton({ status: 'idle' }));

    expect(html).not.toContain('disabled=""');
  });
});
