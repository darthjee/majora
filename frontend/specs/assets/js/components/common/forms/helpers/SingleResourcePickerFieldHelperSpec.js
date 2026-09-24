import SingleResourcePickerFieldHelper
  from '../../../../../../../assets/js/components/common/forms/helpers/SingleResourcePickerFieldHelper.jsx';
import ResourcePickerSearch from '../../../../../../../assets/js/components/common/forms/ResourcePickerSearch.jsx';
import FieldErrors from '../../../../../../../assets/js/components/common/forms/FieldErrors.jsx';
import Badge from '../../../../../../../assets/js/components/common/badges/Badge.jsx';
import { findElement } from './support.js';

describe('SingleResourcePickerFieldHelper', function() {
  const buildState = (overrides = {}) => ({
    picker: { resource: 'source', maxEntries: 4 },
    value: null,
    label: 'Source',
    searchPlaceholder: 'Search sources...',
    searching: false,
    errors: [],
    ...overrides,
  });

  const buildHandlers = () => ({
    onSelect: jasmine.createSpy('onSelect'),
    onReopenSearch: jasmine.createSpy('onReopenSearch'),
    onCancel: jasmine.createSpy('onCancel'),
    onBlur: jasmine.createSpy('onBlur'),
  });
  const labels = { painting: 'Pintura', other: 'Outro' };
  const constantPicker = { values: ['painting', 'other'], translateOption: (value) => labels[value] };

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

    it('does not wire onCancel nor autofocus the search when no value is picked', function() {
      const element = SingleResourcePickerFieldHelper.render(buildState(), buildHandlers());
      const search = findElement(element, (node) => node.type === ResourcePickerSearch);

      expect(search.props.onCancel).toBeUndefined();
      expect(search.props.autoFocus).toBe(false);
    });

    it('wires onCancel and autofocuses the search when re-picking over a picked value', function() {
      const handlers = buildHandlers();
      const value = { id: 1, name: 'Wyrmwood' };
      const element = SingleResourcePickerFieldHelper.render(buildState({ value, searching: true }), handlers);
      const search = findElement(element, (node) => node.type === ResourcePickerSearch);

      expect(search.props.onCancel).toBe(handlers.onCancel);
      expect(search.props.autoFocus).toBe(true);
    });

    it('binds the blur handler on the field wrapper', function() {
      const handlers = buildHandlers();
      const element = SingleResourcePickerFieldHelper.render(buildState(), handlers);

      expect(element.props.onBlur).toBe(handlers.onBlur);
    });

    it('renders the errors through FieldErrors', function() {
      const element = SingleResourcePickerFieldHelper.render(
        buildState({ errors: ['invalid_choice'] }), buildHandlers(),
      );
      const errors = findElement(element, (node) => node.type === FieldErrors);

      expect(errors.props.errors).toEqual(['invalid_choice']);
    });

    describe('in constant mode', function() {
      it('passes values/translateOption to the search core', function() {
        const element = SingleResourcePickerFieldHelper.render(
          buildState({ picker: constantPicker }), buildHandlers(),
        );
        const search = findElement(element, (node) => node.type === ResourcePickerSearch);

        expect(search.props.values).toEqual(['painting', 'other']);
        expect(search.props.translateOption).toBe(constantPicker.translateOption);
        expect(search.props.resource).toBeUndefined();
      });

      it('shows the picked {id, name} item as a badge with its translated name', function() {
        const value = { id: 'painting', name: 'Pintura' };
        const element = SingleResourcePickerFieldHelper.render(
          buildState({ picker: constantPicker, value }), buildHandlers(),
        );
        const badge = findElement(element, (node) => node.type === Badge);

        expect(badge.props.text).toBe('Pintura');
      });
    });
  });
});
