import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import NpcNewPhotoUploadFailedAlert
  from '../../../../../../../../../assets/js/components/resources/character/pages/elements/show/NpcNewPhotoUploadFailedAlert.jsx';

describe('NpcNewPhotoUploadFailedAlert', function() {
  it('renders nothing when status is not photo-upload-failed', function() {
    const html = renderToStaticMarkup(
      React.createElement(NpcNewPhotoUploadFailedAlert, { status: 'idle', handlers: {} }),
    );

    expect(html).toBe('');
  });

  it('renders the warning message with retry/skip buttons when the photo upload failed', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const html = renderToStaticMarkup(
      React.createElement(NpcNewPhotoUploadFailedAlert, { status: 'photo-upload-failed', handlers }),
    );

    expect(html).toContain('alert-warning');
    expect(html).toContain('Failed to upload the photo');
    expect(html).toContain('Retry photo upload');
    expect(html).toContain('Skip and continue');
  });

  it('wires the retry and skip handlers', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const element = NpcNewPhotoUploadFailedAlert({ status: 'photo-upload-failed', handlers });
    const [, retryButton, skipButton] = element.props.children;

    expect(retryButton.props.onClick).toBe(handlers.onRetryPhotoUpload);
    expect(skipButton.props.onClick).toBe(handlers.onSkipPhotoUpload);
  });
});
