import { renderToStaticMarkup } from 'react-dom/server';
import TreasureSubmitButton
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/elements/show/TreasureSubmitButton.jsx';

describe('TreasureSubmitButton', function() {
  it('renders the create-treasure label in new mode', function() {
    const html = renderToStaticMarkup(TreasureSubmitButton({ mode: 'new', status: 'idle' }));

    expect(html).toContain('Create Treasure');
  });

  it('renders the save-changes label in edit mode', function() {
    const html = renderToStaticMarkup(TreasureSubmitButton({ mode: 'edit', status: 'idle' }));

    expect(html).toContain('Save changes');
  });

  it('disables the button while submitting', function() {
    const html = renderToStaticMarkup(TreasureSubmitButton({ mode: 'new', status: 'submitting' }));

    expect(html).toContain('disabled=""');
  });

  it('does not disable the button when idle', function() {
    const html = renderToStaticMarkup(TreasureSubmitButton({ mode: 'new', status: 'idle' }));

    expect(html).not.toContain('disabled=""');
  });
});
