import { renderToStaticMarkup } from 'react-dom/server';
import FactionTitle
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/show/FactionTitle.jsx';

describe('FactionTitle', function() {
  it('renders the edit-faction title', function() {
    const html = renderToStaticMarkup(FactionTitle({ status: 'idle' }));

    expect(html).toContain('Edit faction');
  });

  it('renders an error alert when status is error', function() {
    const html = renderToStaticMarkup(FactionTitle({ status: 'error' }));

    expect(html).toContain('Failed to save faction. Please try again.');
  });

  it('renders no error alert when status is idle', function() {
    const html = renderToStaticMarkup(FactionTitle({ status: 'idle' }));

    expect(html).not.toContain('alert');
  });
});
