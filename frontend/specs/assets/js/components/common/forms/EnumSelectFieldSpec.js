import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import EnumSelectField from '../../../../../../assets/js/components/common/forms/EnumSelectField.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('EnumSelectField', function() {
  const buildProps = (overrides = {}) => ({
    id: 'stl-model-new-type',
    label: 'Type',
    values: ['terrain', 'prop', 'creature'],
    translateOption: (value) => value.toUpperCase(),
    value: 'terrain',
    onChange: Noop.noop,
    ...overrides,
  });

  it('renders the label and select id', function() {
    const html = renderToStaticMarkup(React.createElement(EnumSelectField, buildProps()));

    expect(html).toContain('Type');
    expect(html).toContain('id="stl-model-new-type"');
  });

  it('renders one translated option per value', function() {
    const html = renderToStaticMarkup(React.createElement(EnumSelectField, buildProps()));

    expect(html).toContain('TERRAIN');
    expect(html).toContain('PROP');
    expect(html).toContain('CREATURE');
  });

  it('selects the current value', function() {
    const html = renderToStaticMarkup(React.createElement(EnumSelectField, buildProps({ value: 'prop' })));

    expect(html).toContain('<option value="prop" selected=""');
  });

  it('does not render a blank option by default', function() {
    const html = renderToStaticMarkup(React.createElement(EnumSelectField, buildProps()));

    expect(html).not.toContain('<option value="">');
  });

  it('renders a leading blank option mapping to "" when nullable', function() {
    const html = renderToStaticMarkup(
      React.createElement(EnumSelectField, buildProps({ nullable: true, noneLabel: 'None', value: '' })),
    );

    expect(html).toContain('<option value="" selected="">None</option>');
  });

  it('wires onChange to the select', function() {
    const onChange = jasmine.createSpy('onChange');
    const rendered = EnumSelectField(buildProps({ onChange }));
    const select = rendered.props.children[1];

    select.props.onChange();

    expect(onChange).toHaveBeenCalled();
  });
});
