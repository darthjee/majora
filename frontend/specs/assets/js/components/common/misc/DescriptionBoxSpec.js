import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import DescriptionBox from '../../../../../../assets/js/components/common/misc/DescriptionBox.jsx';
import DescriptionBoxHelper from '../../../../../../assets/js/components/common/misc/helpers/DescriptionBoxHelper.jsx';

describe('DescriptionBox', function() {
  const renderBox = (props = {}) => {
    let capturedDescription;
    let capturedState;
    let capturedHandlers;

    spyOn(DescriptionBoxHelper, 'render').and.callFake((description, state, handlers) => {
      capturedDescription = description;
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'description-box');
    });

    renderToStaticMarkup(React.createElement(DescriptionBox, { description: 'The future king.', ...props }));

    return { description: capturedDescription, state: capturedState, handlers: capturedHandlers };
  };

  it('renders nothing when description is absent', function() {
    const html = renderToStaticMarkup(React.createElement(DescriptionBox, {}));
    expect(html).toBe('');
  });

  it('renders the box markup via DescriptionBoxHelper when description is present', function() {
    const html = renderToStaticMarkup(React.createElement(DescriptionBox, { description: 'The future king.' }));
    expect(html).toContain('The future king.');
    expect(html).toContain('border');
  });

  it('forwards the description through to the helper', function() {
    const { description } = renderBox({ description: 'Line one.\nLine two.' });

    expect(description).toBe('Line one.\nLine two.');
  });

  it('starts collapsed and not overflowing, with a fixed collapsed max height', function() {
    const { state } = renderBox();

    expect(state.expanded).toBe(false);
    expect(state.isOverflowing).toBe(false);
    expect(state.maxCollapsedHeight).toEqual(jasmine.any(Number));
  });

  it('exposes a box ref and a toggle handler without throwing', function() {
    const { handlers } = renderBox();

    expect(handlers.boxRef).toEqual(jasmine.objectContaining({ current: null }));
    expect(() => handlers.onToggle()).not.toThrow();
  });
});
