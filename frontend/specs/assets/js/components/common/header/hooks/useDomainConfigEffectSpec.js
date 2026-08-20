import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import useDomainConfigEffect, { applyDomainConfig }
  from '../../../../../../../assets/js/components/common/header/hooks/useDomainConfigEffect.js';

/**
 * Minimal component exercising `useDomainConfigEffect`, used to assert the hook can be called
 * from a real component body without violating the rules of hooks.
 *
 * @param {object} props - Component props.
 * @param {object} props.domainConfig - Domain config passed through to the hook.
 * @returns {React.ReactElement} A trivial element.
 */
function TestHost({ domainConfig }) {
  useDomainConfigEffect(domainConfig);
  return React.createElement('div', null, 'ok');
}

describe('useDomainConfigEffect', function() {
  it('does not throw when called from a component body', function() {
    const domainConfig = { favicon: null, title: 'Majora', subTitle: 'RPG' };

    expect(() => renderToStaticMarkup(React.createElement(TestHost, { domainConfig })))
      .not.toThrow();
  });
});

describe('applyDomainConfig', function() {
  let originalDocument, fakeFaviconLink, fakeDocument;

  beforeEach(function() {
    originalDocument = globalThis.document;
    fakeFaviconLink = { href: '/assets/images/favicon.png' };
    fakeDocument = {
      title: '',
      querySelector: jasmine.createSpy('querySelector').and.returnValue(fakeFaviconLink),
    };
    globalThis.document = fakeDocument;
  });

  afterEach(function() {
    globalThis.document = originalDocument;
  });

  it('always sets document.title from the resolved config', function() {
    applyDomainConfig({ favicon: null, title: 'Custom Domain', subTitle: 'RPG' });

    expect(fakeDocument.title).toBe('Custom Domain');
  });

  it('leaves the favicon link untouched when favicon is null', function() {
    applyDomainConfig({ favicon: null, title: 'Majora', subTitle: 'RPG' });

    expect(fakeDocument.querySelector).not.toHaveBeenCalled();
    expect(fakeFaviconLink.href).toBe('/assets/images/favicon.png');
  });

  it('rewrites the favicon link href when favicon is a real path', function() {
    applyDomainConfig({ favicon: '/domain/custom-favicon.png', title: 'Majora', subTitle: 'RPG' });

    expect(fakeDocument.querySelector).toHaveBeenCalledWith('link[rel="icon"]');
    expect(fakeFaviconLink.href).toBe('/domain/custom-favicon.png');
  });

  it('does not throw when the favicon link element is not found', function() {
    fakeDocument.querySelector.and.returnValue(null);

    expect(() => applyDomainConfig({ favicon: '/domain/custom-favicon.png', title: 'Majora', subTitle: 'RPG' }))
      .not.toThrow();
  });

  it('does nothing when document is unavailable', function() {
    delete globalThis.document;

    expect(() => applyDomainConfig({ favicon: '/domain/custom-favicon.png', title: 'Majora', subTitle: 'RPG' }))
      .not.toThrow();
  });
});
