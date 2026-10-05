import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffStatisticsUserSelect
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/StaffStatisticsUserSelect.jsx';
import StaffStatisticsUserSelectHelper
  from '../../../../../../../../assets/js/components/resources/staff_statistics/pages/elements/helpers/StaffStatisticsUserSelectHelper.jsx';

describe('StaffStatisticsUserSelect', function() {
  let captured;
  let onChange;

  beforeEach(function() {
    onChange = jasmine.createSpy('onChange');
    spyOn(StaffStatisticsUserSelectHelper, 'render').and.callFake((state, handlers) => {
      captured = { state, handlers };
      return React.createElement('div', null, 'user select');
    });
  });

  const render = (props) => renderToStaticMarkup(
    React.createElement(StaffStatisticsUserSelect, { onChange, ...props }),
  );

  it('renders the initial state', function() {
    render({ id: 'user-input', value: '5' });

    expect(captured.state).toEqual({
      id: 'user-input', value: '5', selected: null, searchTerm: '', results: [], searched: false,
    });
  });

  it('calls onChange with the chosen user id as a string', function() {
    render({ value: null });
    captured.handlers.onSelect({ id: 9, name: 'jane' });

    expect(onChange).toHaveBeenCalledWith('9');
  });

  it('calls onChange with null on clear', function() {
    render({ value: '5' });
    captured.handlers.onClear();

    expect(onChange).toHaveBeenCalledWith(null);
  });
});
