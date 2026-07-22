import { renderToStaticMarkup } from 'react-dom/server';
import GameSubmitButton
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameSubmitButton.jsx';

describe('GameSubmitButton', function() {
  it('renders the create-game label in new mode', function() {
    const html = renderToStaticMarkup(GameSubmitButton({ mode: 'new', status: 'idle' }));

    expect(html).toContain('Create Game');
  });

  it('renders the save-changes label in edit mode', function() {
    const html = renderToStaticMarkup(GameSubmitButton({ mode: 'edit', status: 'idle' }));

    expect(html).toContain('Save changes');
  });

  it('disables the button while submitting', function() {
    const html = renderToStaticMarkup(GameSubmitButton({ mode: 'new', status: 'submitting' }));

    expect(html).toContain('disabled=""');
  });

  it('does not disable the button when idle', function() {
    const html = renderToStaticMarkup(GameSubmitButton({ mode: 'new', status: 'idle' }));

    expect(html).not.toContain('disabled=""');
  });
});
