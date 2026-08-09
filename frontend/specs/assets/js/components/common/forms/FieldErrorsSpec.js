import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import FieldErrors from '../../../../../../assets/js/components/common/forms/FieldErrors.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';

describe('FieldErrors', function() {
  it('renders nothing when errors is empty', function() {
    const html = renderToStaticMarkup(
      React.createElement(FieldErrors, { errors: [] })
    );

    expect(html).not.toContain('alert-danger');
  });

  it('renders one alert per error code, resolved via Translator.t', function() {
    spyOn(Translator, 't').and.callFake((key) => `translated(${key})`);

    const html = renderToStaticMarkup(
      React.createElement(FieldErrors, { errors: ['max_length', 'required'] })
    );

    expect(Translator.t).toHaveBeenCalledWith('errors.max_length', 'max_length');
    expect(Translator.t).toHaveBeenCalledWith('errors.required', 'required');
    expect(html.match(/alert-danger/g).length).toBe(2);
    expect(html).toContain('translated(errors.max_length)');
    expect(html).toContain('translated(errors.required)');
  });

  it('falls back to the raw code when no translation entry exists', function() {
    const html = renderToStaticMarkup(
      React.createElement(FieldErrors, { errors: ['some_unmapped_code'] })
    );

    expect(html).toContain('some_unmapped_code');
  });
});
