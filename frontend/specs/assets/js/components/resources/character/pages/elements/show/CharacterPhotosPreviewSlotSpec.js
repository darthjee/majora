import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterPhotosPreviewSlot
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/CharacterPhotosPreviewSlot.jsx';
import Noop from '../../../../../../../../../assets/js/utils/Noop.js';

const findElement = (node, matcher) => {
  if (!node) return null;

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);
      if (match) return match;
    }
    return null;
  }

  if (typeof node !== 'object') return null;
  if (matcher(node)) return node;
  if (typeof node.type === 'function') return findElement(node.type(node.props), matcher);

  return findElement(node.props?.children, matcher);
};

describe('CharacterPhotosPreviewSlot', function() {
  it('renders the photos preview title', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotosPreviewSlot, {
        game_slug: 'demo', id: 7, is_pc: true, photos: [], handlers: {},
      }),
    );

    expect(html).toContain('Photos');
  });

  it('links to the pcs photos page for a PC', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotosPreviewSlot, {
        game_slug: 'demo', id: 7, is_pc: true, photos: [], handlers: {},
      }),
    );

    expect(html).toContain('href="#/games/demo/pcs/7/photos"');
  });

  it('links to the npcs photos page for an NPC', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotosPreviewSlot, {
        game_slug: 'demo', id: 7, is_pc: false, photos: [], handlers: {},
      }),
    );

    expect(html).toContain('href="#/games/demo/npcs/7/photos"');
  });

  it('reads can_set_profile_photo/profile_photo_id off context and passes them through, rendering ' +
    'the mark-as-profile action bar button', function() {
    const photos = [{ id: 1, path: '/photos/1.jpg' }];
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotosPreviewSlot, {
        game_slug: 'demo',
        id: 7,
        is_pc: true,
        photos,
        can_set_profile_photo: true,
        profile_photo_id: 999,
        handlers: { onSetProfilePhoto: Noop.noop },
      }),
    );

    expect(html).toContain('bi-postage-fill');
  });

  it('reads handlers.onSetProfilePhoto off context and wires it to the action bar button', function() {
    const onSetProfilePhoto = jasmine.createSpy('onSetProfilePhoto');
    const photos = [{ id: 1, path: '/photos/1.jpg' }];
    const tree = React.createElement(CharacterPhotosPreviewSlot, {
      game_slug: 'demo',
      id: 7,
      is_pc: true,
      photos,
      can_set_profile_photo: true,
      profile_photo_id: 999,
      handlers: { onSetProfilePhoto },
    });
    const button = findElement(
      tree,
      (node) => node.type === 'button' && node.props?.['aria-label'] && typeof node.props?.onClick === 'function',
    );

    expect(button).not.toBeNull();
    button.props.onClick();

    expect(onSetProfilePhoto).toHaveBeenCalledWith(photos[0].id);
  });
});
