import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import PhotoCard from '../../../../../../assets/js/components/common/cards/PhotoCard.jsx';
import PhotoCardHelper from '../../../../../../assets/js/components/common/cards/helpers/PhotoCardHelper.jsx';
import ActionBar from '../../../../../../assets/js/components/common/misc/ActionBar.jsx';
import Translator from '../../../../../../assets/js/i18n/Translator.js';
import Noop from '../../../../../../assets/js/utils/Noop.js';

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

describe('PhotoCard', function() {
  const photo = { id: 1, path: 'photos/games/demo/photo_ab12.jpg' };

  it('delegates rendering to PhotoCardHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoCard, { photo, alt: 'Demo Game', onClick: Noop.noop })
    );
    expect(html).toContain('photos/games/demo/photo_ab12.jpg');
    expect(html).toContain('alt="Demo Game"');
  });

  it('renders the 6-per-row column classes', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoCard, { photo, alt: 'Demo Game', onClick: Noop.noop })
    );
    expect(html).toContain('col-6 col-sm-4 col-md-3 col-lg-2');
  });

  it('renders a clickable button instead of a navigating link', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoCard, { photo, alt: 'Demo Game', onClick: Noop.noop })
    );
    expect(html).toContain('<button');
    expect(html).not.toContain('<a href');
  });

  it('does not render the mark-as-profile action bar button by default', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoCard, { photo, alt: 'Demo Game', onClick: Noop.noop })
    );
    expect(html).not.toContain('bi-postage-fill');
  });

  it('renders the mark-as-profile action bar button when canSetProfilePhoto is true and isProfilePhoto is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoCard, {
        photo,
        alt: 'Demo Game',
        onClick: Noop.noop,
        canSetProfilePhoto: true,
        isProfilePhoto: false,
        onSetProfilePhoto: Noop.noop,
      })
    );
    const label = Translator.t('photo_view_modal.set_profile_photo');

    expect(html).toContain('bi-postage-fill');
    expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain(`title="${label}"`);
  });

  it('hides the mark-as-profile action bar button when isProfilePhoto is true', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoCard, {
        photo,
        alt: 'Demo Game',
        onClick: Noop.noop,
        canSetProfilePhoto: true,
        isProfilePhoto: true,
        onSetProfilePhoto: Noop.noop,
      })
    );
    expect(html).not.toContain('bi-postage-fill');
  });

  it('hides the mark-as-profile action bar button when canSetProfilePhoto is false', function() {
    const html = renderToStaticMarkup(
      React.createElement(PhotoCard, {
        photo,
        alt: 'Demo Game',
        onClick: Noop.noop,
        canSetProfilePhoto: false,
        isProfilePhoto: false,
        onSetProfilePhoto: Noop.noop,
      })
    );
    expect(html).not.toContain('bi-postage-fill');
  });

  it('calls onSetProfilePhoto (not onClick) with the photo id when the action bar button is clicked', function() {
    const onClick = jasmine.createSpy('onClick');
    const onSetProfilePhoto = jasmine.createSpy('onSetProfilePhoto');

    const element = PhotoCardHelper.render(photo, 'Demo Game', onClick, true, false, onSetProfilePhoto);
    const actionBar = findElement(element, (child) => child.type === ActionBar);

    actionBar.props.secondaryButtons[0].onClick();

    expect(onSetProfilePhoto).toHaveBeenCalledWith(photo.id);
    expect(onClick).not.toHaveBeenCalled();
  });
});
