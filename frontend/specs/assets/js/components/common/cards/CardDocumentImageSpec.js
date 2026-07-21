import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CardDocumentImage from '../../../../../../assets/js/components/common/cards/CardDocumentImage.jsx';

describe('CardDocumentImage', function() {
  it('renders the default document photo with the given alt text when no url is given', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardDocumentImage, { alt: 'Ancient Tome' })
    );
    expect(html).toContain('<img');
    expect(html).toContain('default_document.png');
    expect(html).toContain('alt="Ancient Tome"');
  });

  it('renders the provided url instead of the default photo when present', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardDocumentImage, {
        url: '/photos/game_documents/12/photo.png',
        alt: 'Ancient Tome',
      })
    );
    expect(html).toContain('src="/photos/game_documents/12/photo.png"');
    expect(html).not.toContain('default_document.png');
  });

  it('applies the card-img-top class', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardDocumentImage, { alt: 'Ancient Tome' })
    );
    expect(html).toContain('card-img-top');
  });

  it('wraps the image in a card-photo-square container', function() {
    const html = renderToStaticMarkup(
      React.createElement(CardDocumentImage, { alt: 'Ancient Tome' })
    );
    expect(html).toContain('card-photo-square');
  });
});
