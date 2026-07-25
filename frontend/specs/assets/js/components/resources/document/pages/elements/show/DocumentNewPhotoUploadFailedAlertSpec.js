import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import DocumentNewPhotoUploadFailedAlert
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentNewPhotoUploadFailedAlert.jsx';

describe('DocumentNewPhotoUploadFailedAlert', function() {
  it('renders the warning message with retry/skip buttons', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const html = renderToStaticMarkup(
      React.createElement(DocumentNewPhotoUploadFailedAlert, { handlers }),
    );

    expect(html).toContain('alert-warning');
    expect(html).toContain('Failed to upload the photo. The document was created');
    expect(html).toContain('Retry photo upload');
    expect(html).toContain('Skip and continue');
  });

  it('wires the retry and skip handlers', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const element = DocumentNewPhotoUploadFailedAlert({ handlers });
    const [, retryButton, skipButton] = element.props.children;

    expect(retryButton.props.onClick).toBe(handlers.onRetryPhotoUpload);
    expect(skipButton.props.onClick).toBe(handlers.onSkipPhotoUpload);
  });
});
