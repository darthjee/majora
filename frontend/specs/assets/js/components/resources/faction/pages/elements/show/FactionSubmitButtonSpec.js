import { renderToStaticMarkup } from 'react-dom/server';
import FactionSubmitButton
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/show/FactionSubmitButton.jsx';

describe('FactionSubmitButton', function() {
  it('renders the save-changes label', function() {
    const html = renderToStaticMarkup(FactionSubmitButton({ status: 'idle' }));

    expect(html).toContain('Save changes');
  });

  it('disables the button while submitting', function() {
    const html = renderToStaticMarkup(FactionSubmitButton({ status: 'submitting' }));

    expect(html).toContain('disabled=""');
  });

  it('does not disable the button when idle', function() {
    const html = renderToStaticMarkup(FactionSubmitButton({ status: 'idle' }));

    expect(html).not.toContain('disabled=""');
  });
});
