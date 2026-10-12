import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyCommonItemRow from '../../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyCommonItemRow.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopyCommonItemRow', function() {
  let row;

  const render = (overrides = {}) => renderToStaticMarkup(
    React.createElement('table', null, React.createElement('tbody', null, React.createElement('tr', null,
      React.createElement(StaffCopyCommonItemRow, { row: { ...row, ...overrides }, selected: false, onToggle: jasmine.createSpy('onToggle') }),
    ))),
  );

  beforeEach(function() {
    row = {
      id: 7,
      name: 'Healing Potion',
      category: 'potion',
      price: 50,
      hidden: false,
      photo: 'photos/games/a/common_items/7/photo.png',
      copied_to_target: false,
    };
  });

  it('renders five cells', function() {
    expect(render().match(/<td>/g).length).toBe(5);
  });

  it('renders the cover thumbnail', function() {
    expect(render()).toContain('src="photos/games/a/common_items/7/photo.png"');
  });

  it('renders the placeholder when the common item has no cover', function() {
    const html = render({ photo: null });

    expect(html).not.toContain('<img');
    expect(html).toContain(Translator.t('staff_photos_page.broken_image_alt'));
  });

  it('renders the common item name', function() {
    expect(render()).toContain('<td>Healing Potion</td>');
  });

  it('renders the translated category', function() {
    expect(render()).toContain(`<td>${Translator.t('common_item_page.category.potion')}</td>`);
  });

  it('renders another translated category', function() {
    expect(render({ category: 'ammunition' }))
      .toContain(`<td>${Translator.t('common_item_page.category.ammunition')}</td>`);
  });

  it('renders the price', function() {
    expect(render()).toContain('<td>50</td>');
  });

  it('renders the hidden badge when the common item is hidden', function() {
    const html = render({ hidden: true });

    expect(html).toContain('data-testid="staff-copy-hidden-badge"');
    expect(html).toContain(Translator.t('staff_copies_page.hidden_badge'));
  });

  it('renders an empty visibility cell when the common item is visible', function() {
    const html = render();

    expect(html).not.toContain('staff-copy-hidden-badge');
    expect(html).toContain('<td></td>');
  });
});
