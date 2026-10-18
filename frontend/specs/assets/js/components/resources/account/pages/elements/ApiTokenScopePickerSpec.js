import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenScopePicker from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenScopePicker.jsx';
import ApiTokenScopePickerHelper from '../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/ApiTokenScopePickerHelper.jsx';

describe('ApiTokenScopePicker', function() {
  const scopes = ['npcs:read', 'npcs:write', 'games:read', 'games:write'];
  let onChange;
  let handlers;
  let state;

  const renderPicker = (value, errors) => {
    spyOn(ApiTokenScopePickerHelper, 'render').and.callFake((s, h) => {
      state = s;
      handlers = h;
      return React.createElement('div');
    });
    renderToStaticMarkup(React.createElement(ApiTokenScopePicker, {
      value, scopes, onChange, errors,
    }));
  };

  beforeEach(function() {
    onChange = jasmine.createSpy('onChange');
  });

  it('passes the scopes field errors, defaulting to none', function() {
    renderPicker([]);

    expect(state).toEqual({ value: [], scopes, errors: [] });
  });

  it('forwards the scopes errors', function() {
    renderPicker([], { scopes: ['empty'] });

    expect(state.errors).toEqual(['empty']);
  });

  it('ticks read along with write', function() {
    renderPicker([]);
    handlers.onToggle('npcs:write', true);

    expect(onChange).toHaveBeenCalledWith(['npcs:read', 'npcs:write']);
  });

  it('selects all read', function() {
    renderPicker([]);
    handlers.onSelectAllRead();

    expect(onChange).toHaveBeenCalledWith(['npcs:read', 'games:read']);
  });

  it('selects all write', function() {
    renderPicker([]);
    handlers.onSelectAllWrite();

    expect(onChange.calls.mostRecent().args[0].sort()).toEqual([...scopes].sort());
  });

  it('clears', function() {
    renderPicker(['npcs:read']);
    handlers.onClear();

    expect(onChange).toHaveBeenCalledWith([]);
  });
});
