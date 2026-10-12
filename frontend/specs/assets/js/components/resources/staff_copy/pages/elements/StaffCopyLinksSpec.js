import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyLinks from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyLinks.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

describe('StaffCopyLinks', function() {
  let props;

  const render = (overrides = {}) => renderToStaticMarkup(React.createElement(StaffCopyLinks, { ...props, ...overrides }));

  beforeEach(function() {
    props = {
      target: 'target-game',
      links: [
        { upload_id: 1, upload_type: 'image', status: 'failed', error: 'cross_device', entity: { name: 'Sword', type: 'items' } },
        { upload_id: 2, upload_type: 'file', status: 'pending', error: null, entity: { name: 'Map' } },
      ],
      retrying: [],
      linkErrors: {},
      onRetry: jasmine.createSpy('onRetry'),
    };
  });

  it('is hidden without a target', function() {
    expect(render({ target: '' })).toBe('');
  });

  it('is hidden until the list has loaded', function() {
    expect(render({ links: null })).toBe('');
  });

  it('renders the empty message', function() {
    expect(render({ links: [] })).toContain(Translator.t('staff_copies_page.links_empty'));
  });

  it('renders the headers and one row per link', function() {
    const html = render();

    expect(html).toContain(Translator.t('staff_copies_page.links_title'));
    expect(html).toContain(Translator.t('staff_copies_page.links_entity_column'));
    expect(html).toContain(Translator.t('staff_copies_page.links_error_column'));
    expect(html).toContain(`Sword (${Translator.t('staff_copies_page.types.items')})`);
    expect(html).toContain('<td>Map</td>');
    expect(html).toContain(Translator.t('staff_copies_page.link_error.cross_device'));
    expect(html.split(Translator.t('staff_copies_page.retry')).length - 1).toBe(2);
  });

  it('shows the local error and disables a retrying row', function() {
    const html = render({ retrying: [2], linkErrors: { 1: 'staff_copies_page.link_error.in_flight' } });

    expect(html).toContain(Translator.t('staff_copies_page.link_error.in_flight'));
    expect(html).toContain(Translator.t('staff_copies_page.link_status.linking'));
    expect(html).toContain('disabled=""');
  });
});
