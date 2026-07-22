import { renderToStaticMarkup } from 'react-dom/server';
import ItemTitle
  from '../../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemTitle.jsx';

describe('ItemTitle', function() {
  it('renders the create-item title in new mode', function() {
    const html = renderToStaticMarkup(ItemTitle({ mode: 'new', status: 'idle' }));

    expect(html).toContain('Create Item');
  });

  it('renders the edit-item title in edit mode', function() {
    const html = renderToStaticMarkup(ItemTitle({ mode: 'edit', status: 'idle' }));

    expect(html).toContain('Edit item');
  });

  it('renders an error alert when status is error in new mode', function() {
    const html = renderToStaticMarkup(ItemTitle({ mode: 'new', status: 'error' }));

    expect(html).toContain('Failed to create item. Please try again.');
  });

  it('renders an error alert when status is error in edit mode', function() {
    const html = renderToStaticMarkup(ItemTitle({ mode: 'edit', status: 'error' }));

    expect(html).toContain('Failed to save item. Please try again.');
  });

  it('renders no error alert when status is idle', function() {
    const html = renderToStaticMarkup(ItemTitle({ mode: 'new', status: 'idle' }));

    expect(html).not.toContain('alert');
  });
});
