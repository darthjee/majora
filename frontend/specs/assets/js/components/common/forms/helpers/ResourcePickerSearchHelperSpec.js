import ResourcePickerSearchHelper
  from '../../../../../../../assets/js/components/common/forms/helpers/ResourcePickerSearchHelper.jsx';
import { findElement } from './support.js';

describe('ResourcePickerSearchHelper', function() {
  const buildState = (overrides = {}) => ({
    searchTerm: '',
    results: [],
    searchPlaceholder: 'Search sources...',
    ...overrides,
  });

  const buildHandlers = () => ({
    onSearchChange: jasmine.createSpy('onSearchChange'),
    onSelect: jasmine.createSpy('onSelect'),
  });

  describe('.render', function() {
    it('renders the search placeholder', function() {
      const element = ResourcePickerSearchHelper.render(buildState(), buildHandlers());
      const input = findElement(element, (node) => node.type === 'input');

      expect(input.props.placeholder).toBe('Search sources...');
    });

    it('binds the search input value and onChange handler', function() {
      const handlers = buildHandlers();
      const element = ResourcePickerSearchHelper.render(buildState({ searchTerm: 'gob' }), handlers);
      const input = findElement(element, (node) => node.type === 'input');

      expect(input.props.value).toBe('gob');

      input.props.onChange({ target: { value: 'goblin' } });

      expect(handlers.onSearchChange).toHaveBeenCalledWith('goblin');
    });

    it('renders no result rows when results is empty', function() {
      const element = ResourcePickerSearchHelper.render(buildState(), buildHandlers());
      const button = findElement(element, (node) => node.type === 'button');

      expect(button).toBeNull();
    });

    it('renders a row per result with its photo and name', function() {
      const results = [{ id: 1, name: 'Wyrmwood', photo_url: 'https://example.com/photo.png' }];
      const element = ResourcePickerSearchHelper.render(buildState({ results }), buildHandlers());
      const img = findElement(element, (node) => node.type === 'img');

      expect(img.props.src).toBe('https://example.com/photo.png');
      expect(img.props.alt).toBe('Wyrmwood');
    });

    it('calls onSelect with the picked item when a row is clicked', function() {
      const handlers = buildHandlers();
      const item = { id: 1, name: 'Wyrmwood', photo_url: null };
      const element = ResourcePickerSearchHelper.render(buildState({ results: [item] }), handlers);
      const button = findElement(element, (node) => node.type === 'button');

      button.props.onClick();

      expect(handlers.onSelect).toHaveBeenCalledWith(item);
    });
  });
});
