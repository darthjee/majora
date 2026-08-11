import SingleResourcePickerFieldHelper
  from '../../../../../../../assets/js/components/common/forms/helpers/SingleResourcePickerFieldHelper.jsx';
import ResourcePickerSearch from '../../../../../../../assets/js/components/common/forms/ResourcePickerSearch.jsx';
import { findElement } from './support.js';

describe('SingleResourcePickerFieldHelper', function() {
  const buildState = (overrides = {}) => ({
    resource: 'source',
    maxEntries: 4,
    value: null,
    label: 'Source',
    searchPlaceholder: 'Search sources...',
    searching: false,
    ...overrides,
  });

  const buildHandlers = () => ({
    onSelect: jasmine.createSpy('onSelect'),
    onReopenSearch: jasmine.createSpy('onReopenSearch'),
  });

  describe('.render', function() {
    it('renders the label', function() {
      const element = SingleResourcePickerFieldHelper.render(buildState(), buildHandlers());

      expect(JSON.stringify(element)).toContain('Source');
    });

    it('renders the search core when no value is picked', function() {
      const handlers = buildHandlers();
      const element = SingleResourcePickerFieldHelper.render(buildState({ value: null }), handlers);
      const search = findElement(element, (node) => node.type === ResourcePickerSearch);

      expect(search).not.toBeNull();
      expect(search.props.resource).toBe('source');
      expect(search.props.maxEntries).toBe(4);
      expect(search.props.searchPlaceholder).toBe('Search sources...');
      expect(search.props.onSelect).toBe(handlers.onSelect);
    });

    it('renders the search core when searching is true, even with a value picked', function() {
      const value = { id: 1, name: 'Wyrmwood' };
      const element = SingleResourcePickerFieldHelper.render(buildState({ value, searching: true }), buildHandlers());
      const search = findElement(element, (node) => node.type === ResourcePickerSearch);

      expect(search).not.toBeNull();
    });

    it('renders the picked item as a badge when a value is set and not searching', function() {
      const value = { id: 1, name: 'Wyrmwood' };
      const element = SingleResourcePickerFieldHelper.render(buildState({ value }), buildHandlers());
      const search = findElement(element, (node) => node.type === ResourcePickerSearch);
      const button = findElement(element, (node) => node.type === 'button');

      expect(search).toBeNull();
      expect(JSON.stringify(button)).toContain('Wyrmwood');
    });

    it('calls onReopenSearch when the picked item badge is clicked', function() {
      const handlers = buildHandlers();
      const value = { id: 1, name: 'Wyrmwood' };
      const element = SingleResourcePickerFieldHelper.render(buildState({ value }), handlers);
      const button = findElement(element, (node) => node.type === 'button');

      button.props.onClick();

      expect(handlers.onReopenSearch).toHaveBeenCalled();
    });
  });
});
