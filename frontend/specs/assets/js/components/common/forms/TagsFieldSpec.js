import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import TagsField, { handleTagsFieldKeyDown } from '../../../../../../assets/js/components/common/forms/TagsField.jsx';
import Noop from '../../../../../../assets/js/utils/Noop.js';

describe('TagsField', function() {
  const baseProps = {
    id: 'tags-field',
    label: 'Tags',
    placeholder: 'Add a tag',
    addLabel: 'Add',
    tags: [],
    inputValue: '',
    onInputChange: Noop.noop,
    onAdd: Noop.noop,
  };

  it('renders the label', function() {
    const html = renderToStaticMarkup(React.createElement(TagsField, baseProps));
    expect(html).toContain('Tags');
  });

  it('renders the pending tags as badges', function() {
    const html = renderToStaticMarkup(
      React.createElement(TagsField, { ...baseProps, tags: ['goblin', 'humanoid'] })
    );
    expect(html).toContain('goblin');
    expect(html).toContain('humanoid');
    expect(html).toContain('badge');
  });

  it('renders no badges when there are no pending tags', function() {
    const html = renderToStaticMarkup(React.createElement(TagsField, baseProps));
    expect(html).not.toContain('badge');
  });

  it('renders the text input with the current input value', function() {
    const html = renderToStaticMarkup(
      React.createElement(TagsField, { ...baseProps, inputValue: 'goblin' })
    );
    expect(html).toContain('value="goblin"');
  });

  it('renders the placeholder', function() {
    const html = renderToStaticMarkup(React.createElement(TagsField, baseProps));
    expect(html).toContain('placeholder="Add a tag"');
  });

  it('renders the Add button label', function() {
    const html = renderToStaticMarkup(React.createElement(TagsField, baseProps));
    expect(html).toContain('>Add<');
  });

  it('renders field-level errors', function() {
    const html = renderToStaticMarkup(
      React.createElement(TagsField, { ...baseProps, errors: ['is too long'] })
    );
    expect(html).toContain('is too long');
  });

  describe('.handleTagsFieldKeyDown', function() {
    it('prevents default and calls onAdd when Enter is pressed', function() {
      const onAdd = jasmine.createSpy('onAdd');
      const event = { key: 'Enter', preventDefault: jasmine.createSpy('preventDefault') };

      handleTagsFieldKeyDown(event, onAdd);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onAdd).toHaveBeenCalled();
    });

    it('does nothing for other keys', function() {
      const onAdd = jasmine.createSpy('onAdd');
      const event = { key: 'a', preventDefault: jasmine.createSpy('preventDefault') };

      handleTagsFieldKeyDown(event, onAdd);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(onAdd).not.toHaveBeenCalled();
    });
  });
});
