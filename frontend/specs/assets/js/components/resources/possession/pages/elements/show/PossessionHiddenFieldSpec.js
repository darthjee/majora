import { renderToStaticMarkup } from 'react-dom/server';
import PossessionHiddenField
  from '../../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionHiddenField.jsx';

describe('PossessionHiddenField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    hidden: false,
    handlers: { onHiddenChange: jasmine.createSpy('onHiddenChange') },
    ...overrides,
  });

  it('renders a mode-scoped id in new mode', function() {
    const html = renderToStaticMarkup(PossessionHiddenField(buildProps()));

    expect(html).toContain('id="possession-new-hidden"');
  });

  it('scopes the id to edit mode', function() {
    const html = renderToStaticMarkup(PossessionHiddenField(buildProps({ mode: 'edit' })));

    expect(html).toContain('id="possession-edit-hidden"');
  });

  it('renders as a bootstrap switch', function() {
    const html = renderToStaticMarkup(PossessionHiddenField(buildProps()));

    expect(html).toContain('form-switch');
    expect(html).toContain('role="switch"');
  });

  it('renders checked when hidden is true', function() {
    const html = renderToStaticMarkup(PossessionHiddenField(buildProps({ hidden: true })));

    expect(html).toContain('checked=""');
  });

  it('does not render checked when hidden is false', function() {
    const html = renderToStaticMarkup(PossessionHiddenField(buildProps({ hidden: false })));

    expect(html).not.toContain('checked=""');
  });

  it('wires onChange to handlers.onHiddenChange', function() {
    const handlers = { onHiddenChange: jasmine.createSpy('onHiddenChange') };
    const element = PossessionHiddenField(buildProps({ handlers }));

    expect(element.props.children[0].props.onChange).toBe(handlers.onHiddenChange);
  });
});
