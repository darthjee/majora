import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardFileImage from '../../../../../../assets/js/components/common/cards/CardFileImage.jsx';

describe('CardFileImage', function() {
  it('renders the default file photo with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardFileImage, { alt: 'Campaign Notes' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_file.png');
    expect(html).toContain('alt="Campaign Notes"');
  });

  it('renders the provided url instead of the default photo when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardFileImage, {
        url: '/photos/game_document_files/12/photo.png',
        alt: 'Campaign Notes',
      })
    );
    expect(html).toContain('src="/photos/game_document_files/12/photo.png"');
    expect(html).not.toContain('default_file.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardFileImage, { alt: 'Campaign Notes' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardFileImage, { alt: 'Campaign Notes' })
    );
    expect(html).toContain('card-photo-square');
  });
});
