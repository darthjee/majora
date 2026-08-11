import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import ResourcePickerSearch, { fetchResourcePickerResults }
  from '../../../../../../assets/js/components/common/forms/ResourcePickerSearch.jsx';
import ResourcePickerSearchHelper
  from '../../../../../../assets/js/components/common/forms/helpers/ResourcePickerSearchHelper.jsx';
import RequestStore from '../../../../../../assets/js/utils/requests/RequestStore.js';

describe('ResourcePickerSearch', function() {
  const renderPicker = (props = {}) => {
    let capturedState;
    let capturedHandlers;

    spyOn(ResourcePickerSearchHelper, 'render').and.callFake((state, handlers) => {
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'resource-picker-search');
    });

    renderToStaticMarkup(React.createElement(ResourcePickerSearch, {
      resource: 'source',
      maxEntries: 4,
      onSelect: jasmine.createSpy('onSelect'),
      searchPlaceholder: 'Search sources...',
      ...props,
    }));

    return { state: capturedState, handlers: capturedHandlers };
  };

  it('passes the default state to the helper', function() {
    const { state } = renderPicker();

    expect(state.searchTerm).toBe('');
    expect(state.results).toEqual([]);
    expect(state.searchPlaceholder).toBe('Search sources...');
  });

  it('forwards onSelect as-is to the helper', function() {
    const onSelect = jasmine.createSpy('onSelect');
    const { handlers } = renderPicker({ onSelect });

    expect(handlers.onSelect).toBe(onSelect);
  });

  it('does not throw when onSearchChange is triggered', function() {
    const { handlers } = renderPicker();

    expect(() => handlers.onSearchChange('goblin')).not.toThrow();
  });

  describe('.fetchResourcePickerResults', function() {
    it('fetches the resource collection with the given search/pagination params', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({
        data: [{ id: 1, name: 'Wyrmwood' }], pagination: { page: 1, pages: 1 },
      }));

      const results = await fetchResourcePickerResults({ resource: 'source', maxEntries: 4, searchTerm: 'wyrm' });

      expect(RequestStore.ensure).toHaveBeenCalledWith(jasmine.objectContaining({
        resource: 'source',
        quantityType: 'collection',
        query: { per_page: 4, name: 'wyrm' },
      }));
      expect(results).toEqual([{ id: 1, name: 'Wyrmwood' }]);
    });

    it('defaults to an empty array when the response data is not an array', async function() {
      spyOn(RequestStore, 'ensure').and.returnValue(Promise.resolve({ data: null, pagination: { page: 1, pages: 1 } }));

      const results = await fetchResourcePickerResults({ resource: 'collection', maxEntries: 4, searchTerm: '' });

      expect(results).toEqual([]);
    });
  });
});
