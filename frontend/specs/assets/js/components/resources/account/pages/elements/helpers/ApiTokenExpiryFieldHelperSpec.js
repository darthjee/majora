import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenExpiryFieldHelper from '../../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/ApiTokenExpiryFieldHelper.jsx';

describe('ApiTokenExpiryFieldHelper', function() {
  const handlers = { onChoiceChange: jasmine.createSpy(), onDateChange: jasmine.createSpy() };
  const render = (value, errors = []) => renderToStaticMarkup(ApiTokenExpiryFieldHelper.render(
    { value: { customDate: '', ...value }, minDate: '2026-03-11', errors }, handlers,
  ));

  it('renders the four radios with the current one checked', function() {
    const html = render({ choice: '90' });

    ['30 days', '90 days', 'Custom date', 'Never'].forEach((label) => expect(html).toContain(label));
    expect(html).toMatch(/id="api-token-expiry-90"[^>]*checked=""/);
    expect(html).not.toContain('type="date"');
    expect(html).not.toContain('api-token-expiry-never-hint');
  });

  it('renders the date input with tomorrow as min for a custom date', function() {
    const html = render({ choice: 'custom', customDate: '2026-04-01' });

    expect(html).toContain('type="date"');
    expect(html).toContain('min="2026-03-11"');
    expect(html).toContain('value="2026-04-01"');
  });

  it('renders the never hint', function() {
    expect(render({ choice: 'never' })).toContain('data-testid="api-token-expiry-never-hint"');
  });

  it('renders the field errors', function() {
    expect(render({ choice: '90' }, ['expires_in_past'])).toContain('alert-danger');
  });
});
