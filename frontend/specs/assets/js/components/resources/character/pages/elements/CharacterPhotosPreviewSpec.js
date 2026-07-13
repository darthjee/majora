import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CharacterPhotosPreview from '../../../../../../../../assets/js/components/resources/character/pages/elements/CharacterPhotosPreview.jsx';

describe('CharacterPhotosPreview', function() {
  const photos = [
    { id: 1, path: '/photos/1.jpg' },
    { id: 2, path: '/photos/2.jpg' },
  ];

  it('delegates rendering to CharacterPhotosPreviewHelper', function() {
    const html = renderToStaticMarkup(
      React.createElement(CharacterPhotosPreview, {
        photos,
        title: 'Photos',
        seeAllHref: '#/games/epic-quest/pcs/1/photos',
      })
    );
    expect(html).toContain('Photos');
    expect(html).toContain('/photos/1.jpg');
    expect(html).toContain('/photos/2.jpg');
    expect(html).toContain('href="#/games/epic-quest/pcs/1/photos"');
  });
});
