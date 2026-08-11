import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import SwitchField from '../../../../../../assets/js/components/common/forms/SwitchField.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('SwitchField', function() {
  it('renders a checkbox input with role switch', function() {
    const html = renderToStaticMarkup(
      React.createElement(SwitchField, {
        id: 'owned', label: 'Owned', checked: true, onChange: Noop.noop,
      }),
    );

    expect(html).toContain('id="owned"');
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('role="switch"');
  });

  it('renders the checked state', function() {
    const html = renderToStaticMarkup(
      React.createElement(SwitchField, {
        id: 'owned', label: 'Owned', checked: true, onChange: Noop.noop,
      }),
    );

    expect(html).toContain('checked=""');
  });

  it('does not render checked when false', function() {
    const html = renderToStaticMarkup(
      React.createElement(SwitchField, {
        id: 'owned', label: 'Owned', checked: false, onChange: Noop.noop,
      }),
    );

    expect(html).not.toContain('checked=""');
  });

  it('renders the translated label', function() {
    const html = renderToStaticMarkup(
      React.createElement(SwitchField, {
        id: 'owned', label: 'Owned', checked: true, onChange: Noop.noop,
      }),
    );

    expect(html).toContain('Owned');
    expect(html).toContain('for="owned"');
  });

  it('wires onChange to the input', function() {
    const onChange = jasmine.createSpy('onChange');
    const element = React.createElement(SwitchField, {
      id: 'owned', label: 'Owned', checked: true, onChange,
    });
    const rendered = SwitchField(element.props);
    const input = rendered.props.children[0];

    input.props.onChange();

    expect(onChange).toHaveBeenCalled();
  });
});
