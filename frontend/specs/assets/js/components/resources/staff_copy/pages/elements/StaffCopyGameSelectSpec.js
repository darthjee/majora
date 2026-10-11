import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCopyGameSelect, {
  gameOptionLabel,
} from '../../../../../../../../assets/js/components/resources/staff_copy/pages/elements/StaffCopyGameSelect.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';

const GAMES = [
  { slug: 'dragon', name: 'Dragon Hunt', domain_groups: ['main', 'beta'] },
  { slug: 'plain', name: 'Plain Game', domain_groups: [] },
];

describe('StaffCopyGameSelect', function() {
  let props;

  beforeEach(function() {
    props = {
      id: 'staff-copy-from',
      labelKey: 'staff_copies_page.source_label',
      games: GAMES,
      value: 'plain',
      onChange: jasmine.createSpy('onChange'),
    };
  });

  describe('gameOptionLabel', function() {
    it('appends the joined domain groups in parentheses', function() {
      expect(gameOptionLabel(GAMES[0])).toBe('Dragon Hunt (main, beta)');
    });

    it('omits the parentheses when there are no domain groups', function() {
      expect(gameOptionLabel(GAMES[1])).toBe('Plain Game');
      expect(gameOptionLabel({ name: 'No groups' })).toBe('No groups');
    });
  });

  it('renders the label, placeholder and one option per game', function() {
    const html = renderToStaticMarkup(React.createElement(StaffCopyGameSelect, props));

    expect(html).toContain(Translator.t('staff_copies_page.source_label'));
    expect(html).toContain(`<option value="">${Translator.t('staff_copies_page.select_placeholder')}</option>`);
    expect(html).toContain('<option value="dragon">Dragon Hunt (main, beta)</option>');
    expect(html).toContain('<option value="plain" selected="">Plain Game</option>');
  });

  it('calls onChange with the selected slug', function() {
    const select = StaffCopyGameSelect(props).props.children[1];

    select.props.onChange({ target: { value: 'dragon' } });

    expect(props.onChange).toHaveBeenCalledWith('dragon');
  });

  it('disables the select when asked', function() {
    const html = renderToStaticMarkup(React.createElement(StaffCopyGameSelect, { ...props, disabled: true }));

    expect(html).toContain('disabled=""');
  });
});
