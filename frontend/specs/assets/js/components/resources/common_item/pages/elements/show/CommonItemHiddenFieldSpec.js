import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemHiddenField
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemHiddenField.jsx';

describe('CommonItemHiddenField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    hidden: false,
    handlers: { onHiddenChange: jasmine.createSpy('onHiddenChange') },
    ...overrides,
  });

  it('renders a mode-scoped id in new mode', function() {
    const html = renderToStaticMarkup(CommonItemHiddenField(buildProps()));

    expect(html).toContain('id="common-item-new-hidden"');
  });

  it('scopes the id to edit mode', function() {
    const html = renderToStaticMarkup(CommonItemHiddenField(buildProps({ mode: 'edit' })));

    expect(html).toContain('id="common-item-edit-hidden"');
  });

  it('renders as a bootstrap switch', function() {
    const html = renderToStaticMarkup(CommonItemHiddenField(buildProps()));

    expect(html).toContain('form-switch');
    expect(html).toContain('role="switch"');
  });

  it('renders checked when hidden is true', function() {
    const html = renderToStaticMarkup(CommonItemHiddenField(buildProps({ hidden: true })));

    expect(html).toContain('checked=""');
  });

  it('does not render checked when hidden is false', function() {
    const html = renderToStaticMarkup(CommonItemHiddenField(buildProps({ hidden: false })));

    expect(html).not.toContain('checked=""');
  });

  it('wires onChange to handlers.onHiddenChange', function() {
    const handlers = { onHiddenChange: jasmine.createSpy('onHiddenChange') };
    const element = CommonItemHiddenField(buildProps({ handlers }));

    expect(element.props.children[0].props.onChange).toBe(handlers.onHiddenChange);
  });
});
