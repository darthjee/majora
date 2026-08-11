import MultiResourcePickerField, { appendResourcePick }
  from '../../../../../../assets/js/components/common/forms/MultiResourcePickerField.jsx';
import ResourcePickerSearch from '../../../../../../assets/js/components/common/forms/ResourcePickerSearch.jsx';
import RemovableBadge from '../../../../../../assets/js/components/common/badges/RemovableBadge.jsx';
import { findElement } from './support.js';

describe('MultiResourcePickerField', function() {
  const buildProps = (overrides = {}) => ({
    resource: 'source',
    maxEntries: 4,
    value: [],
    onChange: jasmine.createSpy('onChange'),
    label: 'Sources',
    searchPlaceholder: 'Search sources...',
    removeLabel: 'Remove',
    ...overrides,
  });

  it('renders the label', function() {
    const element = MultiResourcePickerField(buildProps());

    expect(JSON.stringify(element)).toContain('Sources');
  });

  it('renders the search core with the given resource/maxEntries/searchPlaceholder', function() {
    const element = MultiResourcePickerField(buildProps());
    const search = findElement(element, (node) => node.type === ResourcePickerSearch);

    expect(search.props.resource).toBe('source');
    expect(search.props.maxEntries).toBe(4);
    expect(search.props.searchPlaceholder).toBe('Search sources...');
  });

  it('appends the picked item to value when the search core selects one', function() {
    const onChange = jasmine.createSpy('onChange');
    const element = MultiResourcePickerField(buildProps({ onChange, value: [{ id: 1, name: 'Wyrmwood' }] }));
    const search = findElement(element, (node) => node.type === ResourcePickerSearch);

    search.props.onSelect({ id: 2, name: 'Ashfall' });

    expect(onChange).toHaveBeenCalledWith([{ id: 1, name: 'Wyrmwood' }, { id: 2, name: 'Ashfall' }]);
  });

  it('renders a removable badge per selected item', function() {
    const value = [{ id: 1, name: 'Wyrmwood' }, { id: 2, name: 'Ashfall' }];
    const element = MultiResourcePickerField(buildProps({ value }));

    expect(JSON.stringify(element)).toContain('Wyrmwood');
    expect(JSON.stringify(element)).toContain('Ashfall');
  });

  it('calls onChange without the removed item when a badge is removed', function() {
    const onChange = jasmine.createSpy('onChange');
    const value = [{ id: 1, name: 'Wyrmwood' }, { id: 2, name: 'Ashfall' }];
    const element = MultiResourcePickerField(buildProps({ onChange, value }));
    const badge = findElement(
      element,
      (node) => node.type === RemovableBadge && node.props.text === 'Wyrmwood',
    );

    badge.props.onRemove();

    expect(onChange).toHaveBeenCalledWith([{ id: 2, name: 'Ashfall' }]);
  });

  it('forwards removeLabel to each badge', function() {
    const value = [{ id: 1, name: 'Wyrmwood' }];
    const element = MultiResourcePickerField(buildProps({ value }));
    const badge = findElement(element, (node) => node.type === RemovableBadge);

    expect(badge.props.removeLabel).toBe('Remove');
  });

  describe('.appendResourcePick', function() {
    it('appends an item not already present', function() {
      const value = [{ id: 1, name: 'Wyrmwood' }];

      expect(appendResourcePick(value, { id: 2, name: 'Ashfall' })).toEqual([
        { id: 1, name: 'Wyrmwood' }, { id: 2, name: 'Ashfall' },
      ]);
    });

    it('does not duplicate an item already present by id', function() {
      const value = [{ id: 1, name: 'Wyrmwood' }];

      expect(appendResourcePick(value, { id: 1, name: 'Wyrmwood' })).toEqual(value);
    });
  });
});
