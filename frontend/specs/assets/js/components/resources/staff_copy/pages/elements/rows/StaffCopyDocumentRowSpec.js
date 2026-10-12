import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyDocumentRow from '../../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/rows/StaffCopyDocumentRow.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopyDocumentRow', function() {
  let row;

  const render = (overrides = {}) => renderToStaticMarkup(
    React.createElement('table', null, React.createElement('tbody', null, React.createElement('tr', null,
      React.createElement(StaffCopyDocumentRow, { row: { ...row, ...overrides }, selected: false, onToggle: jasmine.createSpy('onToggle') }),
    ))),
  );

  beforeEach(function() {
    row = {
      id: 12,
      name: 'Royal decree',
      hidden: false,
      photo: 'photos/games/a/documents/12/decree.png',
      pages_count: 3,
      photos_count: 2,
      files_count: 1,
      copied_to_target: false,
    };
  });

  it('renders four cells', function() {
    expect(render().match(/<td>/g).length).toBe(4);
  });

  it('renders the cover thumbnail', function() {
    expect(render()).toContain('src="photos/games/a/documents/12/decree.png"');
  });

  it('renders the placeholder when the document has no cover', function() {
    const html = render({ photo: null });

    expect(html).not.toContain('<img');
    expect(html).toContain(Translator.t('staff_photos_page.broken_image_alt'));
  });

  it('renders the document name', function() {
    expect(render()).toContain('<td>Royal decree</td>');
  });

  it('renders the contents counts', function() {
    const counts = Translator.t('staff_copies_page.document_counts', { pages: 3, photos: 2, files: 1 });

    expect(render()).toContain(`<td>${counts}</td>`);
  });

  it('interpolates the counts of the row', function() {
    const counts = Translator.t('staff_copies_page.document_counts', { pages: 5, photos: 0, files: 4 });

    expect(render({ pages_count: 5, photos_count: 0, files_count: 4 })).toContain(`<td>${counts}</td>`);
  });

  it('renders the hidden badge when the document is hidden', function() {
    const html = render({ hidden: true });

    expect(html).toContain('data-testid="staff-copy-hidden-badge"');
    expect(html).toContain(Translator.t('staff_copies_page.hidden_badge'));
  });

  it('renders an empty visibility cell when the document is visible', function() {
    const html = render();

    expect(html).not.toContain('staff-copy-hidden-badge');
    expect(html).toContain('<td></td>');
  });
});
