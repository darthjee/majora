import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemSubmitButton
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemSubmitButton.jsx';

describe('CommonItemSubmitButton', function() {
  it('renders the create-common-item label in new mode', function() {
    const html = renderToStaticMarkup(CommonItemSubmitButton({ mode: 'new', status: 'idle' }));

    expect(html).toContain('Create Common Item');
  });

  it('renders the save-changes label in edit mode', function() {
    const html = renderToStaticMarkup(CommonItemSubmitButton({ mode: 'edit', status: 'idle' }));

    expect(html).toContain('Save changes');
  });

  it('disables the button while submitting', function() {
    const html = renderToStaticMarkup(CommonItemSubmitButton({ mode: 'new', status: 'submitting' }));

    expect(html).toContain('disabled=""');
  });

  it('does not disable the button when idle', function() {
    const html = renderToStaticMarkup(CommonItemSubmitButton({ mode: 'new', status: 'idle' }));

    expect(html).not.toContain('disabled=""');
  });
});
