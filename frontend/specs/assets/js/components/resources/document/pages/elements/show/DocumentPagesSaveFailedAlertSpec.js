import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import DocumentPagesSaveFailedAlert
  from '../../../../../../../../../assets/js/components/resources/document/pages/elements/show/DocumentPagesSaveFailedAlert.jsx';

describe('DocumentPagesSaveFailedAlert', function() {
  it('renders the warning message with retry/skip buttons', function() {
    const html = renderToStaticMarkup(
      React.createElement(DocumentPagesSaveFailedAlert, {
        onRetry: jasmine.createSpy('onRetry'), onSkip: jasmine.createSpy('onSkip'),
      }),
    );

    expect(html).toContain('alert-warning');
    expect(html).toContain('Failed to save some pages');
    expect(html).toContain('Retry pages save');
    expect(html).toContain('Skip and continue');
  });

  it('wires the onRetry handler to the retry button', function() {
    const onRetry = jasmine.createSpy('onRetry');
    const onSkip = jasmine.createSpy('onSkip');
    const element = DocumentPagesSaveFailedAlert({ onRetry, onSkip });
    const [, retryButton] = element.props.children;

    retryButton.props.onClick();

    expect(onRetry).toHaveBeenCalled();
  });

  it('wires the onSkip handler to the skip button', function() {
    const onRetry = jasmine.createSpy('onRetry');
    const onSkip = jasmine.createSpy('onSkip');
    const element = DocumentPagesSaveFailedAlert({ onRetry, onSkip });
    const [, , skipButton] = element.props.children;

    skipButton.props.onClick();

    expect(onSkip).toHaveBeenCalled();
  });
});
