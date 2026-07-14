import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import TreasureValueField
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/TreasureValueField.jsx';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

describe('TreasureValueField', function() {
  const buildProps = (overrides = {}) => ({
    label: 'Value',
    editLabel: 'Edit',
    value: '500',
    errors: [],
    onOpenModal: jasmine.createSpy('onOpenModal'),
    ...overrides,
  });

  it('renders the given label', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureValueField, buildProps({ label: 'Value' })));

    expect(html).toContain('Value');
  });

  it('renders the collapsed CP/SP/GP breakdown of the given value', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureValueField, buildProps({ value: '500' })));

    expect(html).toContain('5 GP');
  });

  it('renders "0 GP" for an empty string value', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureValueField, buildProps({ value: '' })));

    expect(html).toContain('0 GP');
  });

  it('renders a button with the given editLabel', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureValueField, buildProps({ editLabel: 'Edit' })));

    expect(html).toContain('<button type="button"');
    expect(html).toContain('Edit');
  });

  it('invokes onOpenModal when the button is clicked', function() {
    const onOpenModal = jasmine.createSpy('onOpenModal');
    const element = TreasureValueField(buildProps({ onOpenModal }));
    const button = findElement(element, (child) => child.type === 'button');

    expect(button).not.toBeNull();

    button.props.onClick();

    expect(onOpenModal).toHaveBeenCalled();
  });

  it('renders field errors when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(TreasureValueField, buildProps({ errors: ['must be a positive integer'] })),
    );

    expect(html).toContain('must be a positive integer');
    expect(html).toContain('alert-danger');
  });

  it('renders no field error alerts when none are present', function() {
    const html = renderToStaticMarkup(React.createElement(TreasureValueField, buildProps({ errors: [] })));

    expect(html).not.toContain('alert-danger');
  });
});
