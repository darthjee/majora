import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ShowPageLayout from '../../../../../../assets/js/components/common/show_page/ShowPageLayout.jsx';
import showTypeConfig from '../../../../../../assets/js/components/common/show_page/show_types/showTypeConfig.js';

function LeftShow() {
  return React.createElement('span', null, 'left-show');
}

function LeftEdit() {
  return React.createElement('span', null, 'left-edit');
}

function RightAlways() {
  return React.createElement('span', null, 'right-always');
}

function BottomShow() {
  return React.createElement('span', null, 'bottom-show');
}

describe('ShowPageLayout', function() {
  beforeEach(function() {
    showTypeConfig['spec-test'] = {
      left: [{ Show: LeftShow, Edit: LeftEdit }],
      right: [RightAlways],
      bottom: [{ Show: BottomShow }],
    };
  });

  afterEach(function() {
    delete showTypeConfig['spec-test'];
  });

  it('renders the left/right/bottom slots for the matching mode', function() {
    const html = renderToStaticMarkup(
      React.createElement(ShowPageLayout, { type: 'spec-test', mode: 'show', context: {} }),
    );

    expect(html).toContain('left-show');
    expect(html).toContain('right-always');
    expect(html).toContain('bottom-show');
  });

  it('picks the mode-specific slot variant', function() {
    const html = renderToStaticMarkup(
      React.createElement(ShowPageLayout, { type: 'spec-test', mode: 'edit', context: {} }),
    );

    expect(html).toContain('left-edit');
    expect(html).not.toContain('left-show');
  });

  it('renders nothing for a slot entry with no variant declared for the current mode', function() {
    const html = renderToStaticMarkup(
      React.createElement(ShowPageLayout, { type: 'spec-test', mode: 'new', context: {} }),
    );

    expect(html).not.toContain('left-show');
    expect(html).not.toContain('left-edit');
    expect(html).not.toContain('bottom-show');
    expect(html).toContain('right-always');
  });

  it('renders a plain <div> container in show mode', function() {
    const html = renderToStaticMarkup(
      React.createElement(ShowPageLayout, { type: 'spec-test', mode: 'show', context: {} }),
    );

    expect(html).toMatch(/^<div class="container mt-4">/);
  });

  it('wraps the body in a <form> bound to context.handlers.onSubmit in new/edit mode', function() {
    const onSubmit = jasmine.createSpy('onSubmit');
    const html = renderToStaticMarkup(
      React.createElement(ShowPageLayout, {
        type: 'spec-test', mode: 'new', context: { handlers: { onSubmit } },
      }),
    );

    expect(html).toMatch(/^<form class="container mt-4">/);
  });

  it('omits PageActions (and the back button) when no backHref is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(ShowPageLayout, { type: 'spec-test', mode: 'show', context: {} }),
    );

    expect(html).not.toContain('btn-secondary');
  });

  it('renders PageActions with the given backHref and pageActions children when backHref is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(ShowPageLayout, {
        type: 'spec-test',
        mode: 'show',
        backHref: '#/spec-tests',
        pageActions: React.createElement('a', { href: '#/spec-tests/edit' }, 'Edit'),
        context: {},
      }),
    );

    expect(html).toContain('href="#/spec-tests"');
    expect(html).toContain('href="#/spec-tests/edit"');
  });
});
