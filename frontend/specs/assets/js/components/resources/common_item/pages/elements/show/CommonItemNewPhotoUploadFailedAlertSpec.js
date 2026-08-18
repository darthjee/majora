import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import CommonItemNewPhotoUploadFailedAlert
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemNewPhotoUploadFailedAlert.jsx';

describe('CommonItemNewPhotoUploadFailedAlert', function() {
  it('renders the warning message with retry/skip buttons', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const html = renderToStaticMarkup(
      React.createElement(CommonItemNewPhotoUploadFailedAlert, { handlers }),
    );

    expect(html).toContain('alert-warning');
    expect(html).toContain('Failed to upload the photo. The common item was created');
    expect(html).toContain('Retry photo upload');
    expect(html).toContain('Skip and continue');
  });

  it('wires the retry and skip handlers', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const element = CommonItemNewPhotoUploadFailedAlert({ handlers });
    const [, retryButton, skipButton] = element.props.children;

    expect(retryButton.props.onClick).toBe(handlers.onRetryPhotoUpload);
    expect(skipButton.props.onClick).toBe(handlers.onSkipPhotoUpload);
  });
});
