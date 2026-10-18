import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenGamesPicker, { MAX_GAMES } from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenGamesPicker.jsx';
import ApiTokenGamesPickerHelper from '../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/ApiTokenGamesPickerHelper.jsx';

describe('ApiTokenGamesPicker', function() {
  const options = { games: [{ slug: 'a', name: 'A' }], all_games: true };
  let state;
  let handlers;

  beforeEach(function() {
    spyOn(ApiTokenGamesPickerHelper, 'render').and.callFake((s, h) => {
      state = s;
      handlers = h;
      return React.createElement('div');
    });
  });

  it('re-exports MAX_GAMES', function() {
    expect(MAX_GAMES).toBe(100);
  });

  it('passes the options and games errors to the helper', function() {
    renderToStaticMarkup(React.createElement(ApiTokenGamesPicker, {
      value: [], options, onChange: jasmine.createSpy(), errors: { games: ['max_length'] },
    }));

    expect(state).toEqual({
      value: [], games: options.games, allGames: true, errors: ['max_length'],
    });
  });

  it('maps picks back to slugs', function() {
    const onChange = jasmine.createSpy('onChange');
    renderToStaticMarkup(React.createElement(ApiTokenGamesPicker, { value: [], options, onChange }));

    handlers.onChange([{ id: 'a', name: 'A' }]);

    expect(state.errors).toEqual([]);
    expect(onChange).toHaveBeenCalledWith([{ slug: 'a', name: 'A' }]);
  });
});
