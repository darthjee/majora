import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import AppErrorFallback from '../../../../../../assets/js/components/common/misc/AppErrorFallback.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('AppErrorFallback', function() {
  function render(onReload = Noop.noop) {
    return renderToStaticMarkup(React.createElement(AppErrorFallback, { onReload }));
  }

  it('renders the translated title, message and reload label', function() {
    const html = render();

    expect(html).toContain(Translator.t('error_boundary.title'));
    expect(html).toContain(Translator.t('error_boundary.message'));
    expect(html).toContain(Translator.t('error_boundary.reload'));
  });

  it('renders the english texts', function() {
    const html = render();

    expect(html).toContain('Something went wrong');
    expect(html).toContain('An unexpected error occurred while rendering this page.');
    expect(html).toContain('Reload page');
  });

  it('renders a Bootstrap danger alert', function() {
    const html = render();

    expect(html).toContain('alert-danger');
    expect(html).toContain('role="alert"');
  });

  it('wires the reload button to onReload', function() {
    const onReload = jasmine.createSpy('onReload');
    const element = AppErrorFallback({ onReload });
    const button = element.props.children.props.children[2];

    button.props.onClick();

    expect(button.type).toBe('button');
    expect(onReload).toHaveBeenCalled();
  });
});
