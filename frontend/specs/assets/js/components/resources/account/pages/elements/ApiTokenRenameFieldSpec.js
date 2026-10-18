import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ApiTokenRenameField, {
  buildRenameKeyDownHandler,
} from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokenRenameField.jsx';

describe('ApiTokenRenameField', function() {
  let onSave;
  let onCancel;

  beforeEach(function() {
    onSave = jasmine.createSpy('onSave');
    onCancel = jasmine.createSpy('onCancel');
  });

  const keyEvent = (key) => ({ key, preventDefault: jasmine.createSpy('preventDefault') });

  describe('buildRenameKeyDownHandler', function() {
    it('saves on Enter', function() {
      const event = keyEvent('Enter');

      buildRenameKeyDownHandler(onSave, onCancel)(event);

      expect(onSave).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('cancels on Escape', function() {
      buildRenameKeyDownHandler(onSave, onCancel)(keyEvent('Escape'));

      expect(onCancel).toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
    });

    it('ignores other keys', function() {
      const event = keyEvent('a');

      buildRenameKeyDownHandler(onSave, onCancel)(event);

      expect(onSave).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  it('renders a 100-character input with its errors', function() {
    const html = renderToStaticMarkup(React.createElement(ApiTokenRenameField, {
      value: 'CI', errors: ['blank'], onChange: onSave, onSave, onCancel,
    }));

    expect(html).toContain('maxLength="100"');
    expect(html).toContain('value="CI"');
    expect(html).toContain('alert-danger');
  });

  it('forwards typed values', function() {
    const onChange = jasmine.createSpy('onChange');
    const element = ApiTokenRenameField({ value: 'CI', onChange, onSave, onCancel });
    const input = element.props.children[0];

    input.props.onChange({ target: { value: 'Bot' } });

    expect(onChange).toHaveBeenCalledWith('Bot');
  });
});
