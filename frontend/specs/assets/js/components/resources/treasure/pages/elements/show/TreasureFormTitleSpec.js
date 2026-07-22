import { renderToStaticMarkup } from 'react-dom/server';
import TreasureFormTitle
  from '../../../../../../../../../assets/js/components/resources/treasure/pages/elements/show/TreasureFormTitle.jsx';

describe('TreasureFormTitle', function() {
  it('renders the create-treasure title in new mode', function() {
    const html = renderToStaticMarkup(TreasureFormTitle({ mode: 'new', status: 'idle' }));

    expect(html).toContain('New Treasure');
  });

  it('renders the edit-treasure title in edit mode', function() {
    const html = renderToStaticMarkup(TreasureFormTitle({ mode: 'edit', status: 'idle' }));

    expect(html).toContain('Edit Treasure');
  });

  it('renders an error alert when status is error in new mode', function() {
    const html = renderToStaticMarkup(TreasureFormTitle({ mode: 'new', status: 'error' }));

    expect(html).toContain('Failed to create treasure. Please try again.');
  });

  it('renders an error alert when status is error in edit mode', function() {
    const html = renderToStaticMarkup(TreasureFormTitle({ mode: 'edit', status: 'error' }));

    expect(html).toContain('Failed to save treasure. Please try again.');
  });

  it('renders no error alert when status is idle', function() {
    const html = renderToStaticMarkup(TreasureFormTitle({ mode: 'new', status: 'idle' }));

    expect(html).not.toContain('alert');
  });
});
