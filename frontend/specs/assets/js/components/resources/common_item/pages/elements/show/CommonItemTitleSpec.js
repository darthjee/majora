import { renderToStaticMarkup } from 'react-dom/server';
import CommonItemTitle
  from '../../../../../../../../../assets/js/components/resources/common_item/pages/elements/show/CommonItemTitle.jsx';

describe('CommonItemTitle', function() {
  it('renders the create-common-item title in new mode', function() {
    const html = renderToStaticMarkup(CommonItemTitle({ mode: 'new', status: 'idle' }));

    expect(html).toContain('Create Common Item');
  });

  it('renders the edit-common-item title in edit mode', function() {
    const html = renderToStaticMarkup(CommonItemTitle({ mode: 'edit', status: 'idle' }));

    expect(html).toContain('Edit common item');
  });

  it('renders an error alert when status is error in new mode', function() {
    const html = renderToStaticMarkup(CommonItemTitle({ mode: 'new', status: 'error' }));

    expect(html).toContain('Failed to create common item. Please try again.');
  });

  it('renders an error alert when status is error in edit mode', function() {
    const html = renderToStaticMarkup(CommonItemTitle({ mode: 'edit', status: 'error' }));

    expect(html).toContain('Failed to save common item. Please try again.');
  });

  it('renders no error alert when status is idle', function() {
    const html = renderToStaticMarkup(CommonItemTitle({ mode: 'new', status: 'idle' }));

    expect(html).not.toContain('alert');
  });

  it('renders the photo-upload-failed alert with retry/skip actions in new mode', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const html = renderToStaticMarkup(CommonItemTitle({ mode: 'new', status: 'photo-upload-failed', handlers }));

    expect(html).toContain('Failed to upload the photo. The common item was created');
    expect(html).toContain('Retry photo upload');
    expect(html).toContain('Skip and continue');
  });

  it('does not render the photo-upload-failed alert in edit mode', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const html = renderToStaticMarkup(CommonItemTitle({ mode: 'edit', status: 'photo-upload-failed', handlers }));

    expect(html).not.toContain('Failed to upload the photo');
  });
});
