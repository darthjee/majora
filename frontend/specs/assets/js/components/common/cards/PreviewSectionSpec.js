import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PreviewSection from '../../../../../../assets/js/components/common/cards/PreviewSection.jsx';
import PreviewSectionHelper from '../../../../../../assets/js/components/common/cards/helpers/PreviewSectionHelper.jsx';
import { MAX_PREVIEW_ITEMS } from '../../../../../../assets/js/components/common/cards/characterPreviewConstants.js';
import Icons from '../../../../../../assets/js/utils/ui/Icons.js';

describe('PreviewSection', function() {
  const buildItems = (count) => Array.from({ length: count }, (_, index) => ({ id: index + 1 }));
  const renderItem = (item) => React.createElement('span', { key: item.id }, `Item ${item.id}`);

  const baseProps = {
    items: buildItems(2),
    title: 'Player Characters',
    seeAllCard: { href: '#/games/epic-quest/pcs', icon: Icons.filePerson },
    renderItem,
    sectionState: { loading: false, total: 2, defaultCollapsed: false },
  };

  const renderSection = (props = {}) => {
    let capturedArgs;

    spyOn(PreviewSectionHelper, 'render').and.callFake((...args) => {
      capturedArgs = args;
      return React.createElement('div', null, 'preview-section');
    });

    renderToStaticMarkup(React.createElement(PreviewSection, { ...baseProps, ...props }));

    return capturedArgs;
  };

  it('delegates rendering to PreviewSectionHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(PreviewSection, baseProps)
    );

    expect(html).toContain('Player Characters');
    expect(html).toContain('Item 1');
    expect(html).toContain('Item 2');
    expect(html).toContain('href="#/games/epic-quest/pcs"');
  });

  it('defaults maxItems to MAX_PREVIEW_ITEMS', function() {
    const html = renderToStaticMarkup(
      React.createElement(PreviewSection, { ...baseProps, items: buildItems(MAX_PREVIEW_ITEMS + 2) })
    );

    expect(html).toContain(`Item ${MAX_PREVIEW_ITEMS}`);
    expect(html).not.toContain(`Item ${MAX_PREVIEW_ITEMS + 1}`);
  });

  it('forwards items, title, seeAllCard, maxItems, renderItem, emptyText and sectionState', function() {
    const args = renderSection({
      emptyText: 'No PCs yet.',
      sectionState: { ...baseProps.sectionState, loading: true, total: 5 },
    });

    expect(args[0]).toBe(baseProps.items);
    expect(args[1]).toBe('Player Characters');
    expect(args[2]).toBe(baseProps.seeAllCard);
    expect(args[3]).toBe(MAX_PREVIEW_ITEMS);
    expect(args[4]).toBe(renderItem);
    expect(args[5]).toBe('No PCs yet.');
    expect(args[6].loading).toBe(true);
    expect(args[6].total).toBe(5);
  });

  it('starts collapsed when defaultCollapsed is true', function() {
    const args = renderSection({ sectionState: { ...baseProps.sectionState, defaultCollapsed: true } });

    expect(args[6].collapsed).toBe(true);
  });

  it('starts expanded when defaultCollapsed is false', function() {
    const args = renderSection({ sectionState: { ...baseProps.sectionState, defaultCollapsed: false } });

    expect(args[6].collapsed).toBe(false);
  });

  it('exposes an onToggle handler that does not throw', function() {
    const args = renderSection();

    expect(() => args[7]()).not.toThrow();
  });
});
