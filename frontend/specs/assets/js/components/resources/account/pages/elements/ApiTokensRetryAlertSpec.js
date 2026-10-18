import ApiTokensRetryAlert from '../../../../../../../../assets/js/components/resources/account/pages/elements/ApiTokensRetryAlert.jsx';

describe('ApiTokensRetryAlert', function() {
  it('renders the message in the given variant with a Retry button', function() {
    const onRetry = jasmine.createSpy('onRetry');
    const element = ApiTokensRetryAlert({
      variant: 'danger', message: 'Oops', onRetry, testId: 'x',
    });
    const [message, button] = element.props.children;

    button.props.onClick();

    expect(element.props.className).toContain('alert-danger');
    expect(element.props['data-testid']).toBe('x');
    expect(message.props.children).toBe('Oops');
    expect(button.props.children).toBe('Retry');
    expect(onRetry).toHaveBeenCalled();
  });
});
