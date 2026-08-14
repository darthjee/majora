import { renderToStaticMarkup } from 'react-dom/server';
import StlModelFormFieldsHelper
  from '../../../../../../../../assets/js/components/resources/stl_model/pages/helpers/StlModelFormFieldsHelper.jsx';
import MultiResourcePickerField
  from '../../../../../../../../assets/js/components/common/forms/MultiResourcePickerField.jsx';
import Translator from '../../../../../../../../assets/js/i18n/Translator.js';
import {
  RACE_VALUES, ROLE_VALUES,
} from '../../../../../../../../assets/js/components/resources/stl_model/stlModelEnums.js';

const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  return findElement(node.props?.children, matcher);
};

const findAll = (node, matcher, acc = []) => {
  findElement(node, (child) => {
    if (matcher(child)) acc.push(child);
    return false;
  });
  return acc;
};

describe('StlModelFormFieldsHelper', function() {
  const buildHandlers = () => ({
    onTypeChange: jasmine.createSpy('onTypeChange'),
    onRacesChange: jasmine.createSpy('onRacesChange'),
    onRolesChange: jasmine.createSpy('onRolesChange'),
    onUrlChange: jasmine.createSpy('onUrlChange'),
    onSizeChange: jasmine.createSpy('onSizeChange'),
  });

  const buildState = (overrides = {}) => ({
    type: 'terrain',
    races: [],
    roles: [],
    url: '',
    size: '',
    fieldErrors: {},
    ...overrides,
  });

  describe('.render', function() {
    it('renders the type/url/size fields with the given idPrefix', function() {
      const html = renderToStaticMarkup(
        StlModelFormFieldsHelper.render(buildState(), buildHandlers(), 'stl-model-new'),
      );

      expect(html).toContain('id="stl-model-new-type"');
      expect(html).toContain('id="stl-model-new-url"');
      expect(html).toContain('id="stl-model-new-size"');
    });

    it('wires the type/url/size fields to their change handlers', function() {
      const handlers = buildHandlers();
      const element = StlModelFormFieldsHelper.render(buildState(), handlers, 'stl-model-new');
      const typeSelect = findElement(element, (child) => child.props?.id === 'stl-model-new-type');
      const urlField = findElement(element, (child) => child.props?.id === 'stl-model-new-url');
      const sizeSelect = findElement(element, (child) => child.props?.id === 'stl-model-new-size');

      expect(typeSelect.props.onChange).toBe(handlers.onTypeChange);
      expect(urlField.props.onChange).toBe(handlers.onUrlChange);
      expect(sizeSelect.props.onChange).toBe(handlers.onSizeChange);
    });

    it('renders the url field as a url input', function() {
      const html = renderToStaticMarkup(
        StlModelFormFieldsHelper.render(buildState({ url: 'https://example.com' }), buildHandlers(), 'stl-model-new'),
      );

      expect(html).toContain('type="url"');
      expect(html).toContain('value="https://example.com"');
    });

    it('renders url field errors when present', function() {
      const html = renderToStaticMarkup(StlModelFormFieldsHelper.render(
        buildState({ fieldErrors: { url: ['is invalid'] } }), buildHandlers(), 'stl-model-new',
      ));

      expect(html).toContain('is invalid');
    });

    it('renders a blank/None option for size only', function() {
      const html = renderToStaticMarkup(
        StlModelFormFieldsHelper.render(buildState(), buildHandlers(), 'stl-model-new'),
      );

      expect((html.match(/<option value=""/g) ?? []).length).toBe(1);
    });

    it('renders the races picker in constant mode over RACE_VALUES', function() {
      const element = StlModelFormFieldsHelper.render(buildState(), buildHandlers(), 'stl-model-new');
      const pickers = findAll(element, (child) => child.type === MultiResourcePickerField);
      const racesPicker = pickers.find((picker) => picker.props.values === RACE_VALUES);

      expect(racesPicker).not.toBeUndefined();
      expect(racesPicker.props.value).toEqual([]);
    });

    it('wires the races picker to onRacesChange', function() {
      const handlers = buildHandlers();
      const element = StlModelFormFieldsHelper.render(buildState(), handlers, 'stl-model-new');
      const pickers = findAll(element, (child) => child.type === MultiResourcePickerField);
      const racesPicker = pickers.find((picker) => picker.props.values === RACE_VALUES);

      expect(racesPicker.props.onChange).toBe(handlers.onRacesChange);
    });

    it('renders the roles picker in constant mode over ROLE_VALUES, wired to onRolesChange', function() {
      const handlers = buildHandlers();
      const roles = [{ id: 'wizard', name: 'Wizard' }];
      const element = StlModelFormFieldsHelper.render(buildState({ roles }), handlers, 'stl-model-new');
      const pickers = findAll(element, (child) => child.type === MultiResourcePickerField);
      const rolesPicker = pickers.find((picker) => picker.props.values === ROLE_VALUES);

      expect(rolesPicker).not.toBeUndefined();
      expect(rolesPicker.props.value).toBe(roles);
      expect(rolesPicker.props.onChange).toBe(handlers.onRolesChange);
    });

    it('translates each race/role option via stl_model_page.race_<value>/role_<value>', function() {
      spyOn(Translator, 't').and.callThrough();
      const element = StlModelFormFieldsHelper.render(buildState(), buildHandlers(), 'stl-model-new');
      const pickers = findAll(element, (child) => child.type === MultiResourcePickerField);
      const racesPicker = pickers.find((picker) => picker.props.values === RACE_VALUES);
      const rolesPicker = pickers.find((picker) => picker.props.values === ROLE_VALUES);

      expect(racesPicker.props.translateOption('elf')).toBe(Translator.t('stl_model_page.race_elf'));
      expect(rolesPicker.props.translateOption('wizard')).toBe(Translator.t('stl_model_page.role_wizard'));
    });
  });
});
