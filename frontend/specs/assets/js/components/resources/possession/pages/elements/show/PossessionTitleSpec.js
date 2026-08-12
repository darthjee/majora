import { renderToStaticMarkup } from 'react-dom/server';
import PossessionTitle
  from '../../../../../../../../../assets/js/components/resources/possession/pages/elements/show/PossessionTitle.jsx';

describe('PossessionTitle', function() {
  it('renders the create-possession title in new mode', function() {
    const html = renderToStaticMarkup(PossessionTitle({ mode: 'new', status: 'idle' }));

    expect(html).toContain('Create Possession');
  });

  it('renders the edit-possession title in edit mode', function() {
    const html = renderToStaticMarkup(PossessionTitle({ mode: 'edit', status: 'idle' }));

    expect(html).toContain('Edit possession');
  });

  it('renders an error alert when status is error in new mode', function() {
    const html = renderToStaticMarkup(PossessionTitle({ mode: 'new', status: 'error' }));

    expect(html).toContain('Failed to create possession. Please try again.');
  });

  it('renders an error alert when status is error in edit mode', function() {
    const html = renderToStaticMarkup(PossessionTitle({ mode: 'edit', status: 'error' }));

    expect(html).toContain('Failed to save possession. Please try again.');
  });

  it('renders no error alert when status is idle', function() {
    const html = renderToStaticMarkup(PossessionTitle({ mode: 'new', status: 'idle' }));

    expect(html).not.toContain('alert');
  });

  it('renders the photo-upload-failed alert with retry/skip actions in new mode', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const html = renderToStaticMarkup(PossessionTitle({ mode: 'new', status: 'photo-upload-failed', handlers }));

    expect(html).toContain('Failed to upload the photo. The possession was created');
    expect(html).toContain('Retry photo upload');
    expect(html).toContain('Skip and continue');
  });

  it('does not render the photo-upload-failed alert in edit mode', function() {
    const handlers = {
      onRetryPhotoUpload: jasmine.createSpy('onRetryPhotoUpload'),
      onSkipPhotoUpload: jasmine.createSpy('onSkipPhotoUpload'),
    };
    const html = renderToStaticMarkup(PossessionTitle({ mode: 'edit', status: 'photo-upload-failed', handlers }));

    expect(html).not.toContain('Failed to upload the photo');
  });
});
