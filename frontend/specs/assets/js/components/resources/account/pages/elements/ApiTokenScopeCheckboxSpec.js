import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenScopeCheckbox from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenScopeCheckbox.jsx';

describe('ApiTokenScopeCheckbox', function() {
  const props = {
    family: 'npcs', action: 'write', available: true, checked: true,
  };

  it('renders nothing when the scope is not in the catalogue', function() {
    expect(ApiTokenScopeCheckbox({ ...props, available: false, onToggle: jasmine.createSpy() })).toBeNull();
  });

  it('renders a labelled checkbox', function() {
    const html = renderToStaticMarkup(React.createElement(ApiTokenScopeCheckbox, { ...props, onToggle: jasmine.createSpy() }));

    expect(html).toContain('type="checkbox"');
    expect(html).toContain('aria-label="NPCs Write"');
    expect(html).toContain('checked=""');
  });

  it('calls onToggle with the scope and checked state', function() {
    const onToggle = jasmine.createSpy('onToggle');
    const element = ApiTokenScopeCheckbox({ ...props, onToggle });

    element.props.onChange({ target: { checked: false } });

    expect(onToggle).toHaveBeenCalledWith('npcs:write', false);
  });
});
