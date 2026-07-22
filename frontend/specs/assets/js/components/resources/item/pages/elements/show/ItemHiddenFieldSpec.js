import { renderToStaticMarkup } from 'react-dom/server';
import ItemHiddenField
  from '../../../../../../../../../assets/js/components/resources/item/pages/elements/show/ItemHiddenField.jsx';

describe('ItemHiddenField', function() {
  const buildProps = (overrides = {}) => ({
    mode: 'new',
    hidden: false,
    handlers: { onHiddenChange: jasmine.createSpy('onHiddenChange') },
    ...overrides,
  });

  it('renders a mode-scoped id in new mode', function() {
    const html = renderToStaticMarkup(ItemHiddenField(buildProps()));

    expect(html).toContain('id="character-item-new-hidden"');
  });

  it('scopes the id to edit mode', function() {
    const html = renderToStaticMarkup(ItemHiddenField(buildProps({ mode: 'edit' })));

    expect(html).toContain('id="item-edit-hidden"');
  });

  it('renders as a bootstrap switch', function() {
    const html = renderToStaticMarkup(ItemHiddenField(buildProps()));

    expect(html).toContain('form-switch');
    expect(html).toContain('role="switch"');
  });

  it('renders checked when hidden is true', function() {
    const html = renderToStaticMarkup(ItemHiddenField(buildProps({ hidden: true })));

    expect(html).toContain('checked=""');
  });

  it('does not render checked when hidden is false', function() {
    const html = renderToStaticMarkup(ItemHiddenField(buildProps({ hidden: false })));

    expect(html).not.toContain('checked=""');
  });

  it('wires onChange to handlers.onHiddenChange', function() {
    const handlers = { onHiddenChange: jasmine.createSpy('onHiddenChange') };
    const element = ItemHiddenField(buildProps({ handlers }));

    expect(element.props.children[0].props.onChange).toBe(handlers.onHiddenChange);
  });
});
