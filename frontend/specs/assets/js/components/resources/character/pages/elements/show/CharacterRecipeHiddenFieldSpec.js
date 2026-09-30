import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import CharacterRecipeHiddenField
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterRecipeHiddenField.jsx';
import Translator from '../../../../../../../../../assets/js/i18n/Translator.js';

describe('CharacterRecipeHiddenField', function() {
  it('renders nothing when hidden is absent (regular variant)', function() {
    expect(CharacterRecipeHiddenField({ handlers: {} })).toBeNull();
  });

  it('renders a checked switch when hidden is true', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterRecipeHiddenField, {
      hidden: true, handlers: { onHiddenChange: jasmine.createSpy() },
    }));

    expect(html).toContain('checked');
    expect(html).toContain(Translator.t('character_recipe_page.hidden_toggle_label'));
  });

  it('renders an unchecked switch when hidden is false', function() {
    const html = renderToStaticMarkup(React.createElement(CharacterRecipeHiddenField, {
      hidden: false, handlers: { onHiddenChange: jasmine.createSpy() },
    }));

    expect(html).not.toContain('checked');
  });

  it('forwards the new checked value to handlers.onHiddenChange', function() {
    const onHiddenChange = jasmine.createSpy('onHiddenChange');
    const element = CharacterRecipeHiddenField({ hidden: false, handlers: { onHiddenChange } });
    const input = element.props.children[0];

    input.props.onChange({ target: { checked: true } });

    expect(onHiddenChange).toHaveBeenCalledWith(true);
  });
});
