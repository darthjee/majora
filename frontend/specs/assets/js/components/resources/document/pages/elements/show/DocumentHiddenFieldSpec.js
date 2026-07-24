import { renderToStaticMarkup } from 'react-dom/server';
import DocumentHiddenField
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentHiddenField.jsx';

describe('DocumentHiddenField', function() {
  const buildProps = (overrides = {}) => ({
    hidden: false,
    handlers: { onHiddenChange: jasmine.createSpy('onHiddenChange') },
    ...overrides,
  });

  it('renders the new-mode id', function() {
    const html = renderToStaticMarkup(DocumentHiddenField(buildProps()));

    expect(html).toContain('id="document-new-hidden"');
  });

  it('renders as a bootstrap switch', function() {
    const html = renderToStaticMarkup(DocumentHiddenField(buildProps()));

    expect(html).toContain('form-switch');
    expect(html).toContain('role="switch"');
  });

  it('renders checked when hidden is true', function() {
    const html = renderToStaticMarkup(DocumentHiddenField(buildProps({ hidden: true })));

    expect(html).toContain('checked=""');
  });

  it('does not render checked when hidden is false', function() {
    const html = renderToStaticMarkup(DocumentHiddenField(buildProps({ hidden: false })));

    expect(html).not.toContain('checked=""');
  });

  it('wires onChange to handlers.onHiddenChange', function() {
    const handlers = { onHiddenChange: jasmine.createSpy('onHiddenChange') };
    const element = DocumentHiddenField(buildProps({ handlers }));

    expect(element.props.children[0].props.onChange).toBe(handlers.onHiddenChange);
  });
});
