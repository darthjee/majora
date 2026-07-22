import { renderToStaticMarkup } from 'react-dom/server';
import ItemSubmitButton
  from '../../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemSubmitButton.jsx';

describe('ItemSubmitButton', function() {
  it('renders the create-item label in new mode', function() {
    const html = renderToStaticMarkup(ItemSubmitButton({ mode: 'new', status: 'idle' }));

    expect(html).toContain('Create Item');
  });

  it('renders the save-changes label in edit mode', function() {
    const html = renderToStaticMarkup(ItemSubmitButton({ mode: 'edit', status: 'idle' }));

    expect(html).toContain('Save changes');
  });

  it('disables the button while submitting', function() {
    const html = renderToStaticMarkup(ItemSubmitButton({ mode: 'new', status: 'submitting' }));

    expect(html).toContain('disabled=""');
  });

  it('does not disable the button when idle', function() {
    const html = renderToStaticMarkup(ItemSubmitButton({ mode: 'new', status: 'idle' }));

    expect(html).not.toContain('disabled=""');
  });
});
