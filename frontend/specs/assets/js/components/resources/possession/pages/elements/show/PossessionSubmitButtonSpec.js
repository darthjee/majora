import { renderToStaticMarkup } from 'react-dom/server';
import PossessionSubmitButton
  from '../../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionSubmitButton.jsx';

describe('PossessionSubmitButton', function() {
  it('renders the create-possession label in new mode', function() {
    const html = renderToStaticMarkup(PossessionSubmitButton({ mode: 'new', status: 'idle' }));

    expect(html).toContain('Create Possession');
  });

  it('renders the save-changes label in edit mode', function() {
    const html = renderToStaticMarkup(PossessionSubmitButton({ mode: 'edit', status: 'idle' }));

    expect(html).toContain('Save changes');
  });

  it('disables the button while submitting', function() {
    const html = renderToStaticMarkup(PossessionSubmitButton({ mode: 'new', status: 'submitting' }));

    expect(html).toContain('disabled=""');
  });

  it('does not disable the button when idle', function() {
    const html = renderToStaticMarkup(PossessionSubmitButton({ mode: 'new', status: 'idle' }));

    expect(html).not.toContain('disabled=""');
  });
});
