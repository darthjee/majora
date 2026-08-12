import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import FactionNewPhotoUploadFailedAlert
  from '../../../../../../../../../assets/js/components/resources/faction/pages/elements/show/FactionNewPhotoUploadFailedAlert.jsx';

describe('FactionNewPhotoUploadFailedAlert', function() {
  it('renders the warning message with retry/skip buttons', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const html = renderToStaticMarkup(
      React.createElement(FactionNewPhotoUploadFailedAlert, { handlers }),
    );

    expect(html).toContain('alert-warning');
    expect(html).toContain('Failed to upload the photo. The faction was created');
    expect(html).toContain('Retry photo upload');
    expect(html).toContain('Skip and continue');
  });

  it('wires the retry and skip handlers', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const element = FactionNewPhotoUploadFailedAlert({ handlers });
    const [, retryButton, skipButton] = element.props.children;

    expect(retryButton.props.onClick).toBe(handlers.onRetryPhotoUpload);
    expect(skipButton.props.onClick).toBe(handlers.onSkipPhotoUpload);
  });
});
