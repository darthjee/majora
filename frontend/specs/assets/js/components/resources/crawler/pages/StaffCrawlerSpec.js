import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import StaffCrawler, { isScrolledToBottom, scrollFeedToBottom }
  from '../../../../../../../assets/js/components/resources/crawler/pages/StaffCrawler.jsx';
import StaffCrawlerController
  from '../../../../../../../assets/js/components/resources/crawler/pages/controllers/StaffCrawlerController.js';
import StaffCrawlerHelper
  from '../../../../../../../assets/js/components/resources/crawler/pages/helpers/StaffCrawlerHelper.jsx';
import { stubBuildEffect, stubRenderLoading, captureConstructorFields }
  from '../../../../../../support/controllerStubs.js';

describe('StaffCrawler', function() {
  it('renders the loading state while checking access', function() {
    stubBuildEffect(StaffCrawlerController);
    stubRenderLoading(StaffCrawlerHelper);

    const html = renderToStaticMarkup(React.createElement(StaffCrawler));

    expect(html).toContain('loading');
  });

  it('constructs the controller with real setLoading/setError/setEmissions/setSelectedId setters', function() {
    stubBuildEffect(StaffCrawlerController);
    const capture = captureConstructorFields(
      StaffCrawlerController, ['setLoading', 'setError', 'setEmissions', 'setSelectedId'],
    );

    try {
      renderToStaticMarkup(React.createElement(StaffCrawler));

      expect(capture.spies.setLoading).toEqual(jasmine.any(Function));
      expect(capture.spies.setError).toEqual(jasmine.any(Function));
      expect(capture.spies.setEmissions).toEqual(jasmine.any(Function));
      expect(capture.spies.setSelectedId).toEqual(jasmine.any(Function));
    } finally {
      capture.restore();
    }
  });

  describe('isScrolledToBottom', function() {
    it('defaults to true (at bottom) when the feed element is not mounted yet', function() {
      expect(isScrolledToBottom(null)).toBe(true);
    });

    it('is true when scrolled exactly to the bottom', function() {
      const feed = { scrollTop: 100, scrollHeight: 200, clientHeight: 100 };

      expect(isScrolledToBottom(feed)).toBe(true);
    });

    it('is true when within the default tolerance of the bottom', function() {
      const feed = { scrollTop: 97, scrollHeight: 200, clientHeight: 100 };

      expect(isScrolledToBottom(feed)).toBe(true);
    });

    it('is false when scrolled up past the tolerance', function() {
      const feed = { scrollTop: 50, scrollHeight: 200, clientHeight: 100 };

      expect(isScrolledToBottom(feed)).toBe(false);
    });

    it('honors a custom tolerance', function() {
      const feed = { scrollTop: 90, scrollHeight: 200, clientHeight: 100 };

      expect(isScrolledToBottom(feed, 5)).toBe(false);
      expect(isScrolledToBottom(feed, 20)).toBe(true);
    });
  });

  describe('scrollFeedToBottom', function() {
    it('does nothing when the feed element is not mounted yet', function() {
      expect(() => scrollFeedToBottom(null)).not.toThrow();
    });

    it('sets scrollTop to scrollHeight', function() {
      const feed = { scrollTop: 10, scrollHeight: 500 };

      scrollFeedToBottom(feed);

      expect(feed.scrollTop).toBe(500);
    });
  });
});
