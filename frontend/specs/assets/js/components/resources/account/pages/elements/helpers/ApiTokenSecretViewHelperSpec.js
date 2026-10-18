import ApiTokenSecretViewHelper from '../../../../../../../../../assets/js/components/resources/account/pages/elements/helpers/ApiTokenSecretViewHelper.jsx';

const findAll = (node, matcher, found = []) => {
  if (Array.isArray(node)) {
    node.forEach((child) => findAll(child, matcher, found));
  } else if (node && typeof node === 'object') {
    if (matcher(node)) found.push(node);
    findAll(node.props?.children, matcher, found);
  }
  return found;
};
const byTestId = (element, id) => findAll(element, (node) => node.props?.['data-testid'] === id);

describe('ApiTokenSecretViewHelper', function() {
  const handlers = { onCopy: jasmine.createSpy('onCopy'), onDone: jasmine.createSpy('onDone') };
  const build = (copyStatus = null) => ApiTokenSecretViewHelper.render({ token: 'mjr_secret', copyStatus }, handlers);

  it('shows the full token in a read-only field that selects itself on focus', function() {
    const input = byTestId(build(), 'api-token-secret')[0];
    const select = jasmine.createSpy('select');

    input.props.onFocus({ target: { select } });

    expect(input.props.value).toBe('mjr_secret');
    expect(input.props.readOnly).toBeTrue();
    expect(input.props.className).toContain('font-monospace');
    expect(select).toHaveBeenCalled();
  });

  it('has no close button', function() {
    const header = findAll(build(), (node) => node.props?.closeButton);

    expect(header.length).toBe(0);
  });

  it('wires Copy and Done', function() {
    const element = build();
    const buttons = findAll(element, (node) => node.type === 'button');

    buttons.forEach((button) => button.props.onClick());

    expect(handlers.onCopy).toHaveBeenCalled();
    expect(handlers.onDone).toHaveBeenCalled();
  });

  it('shows Copied after a successful copy', function() {
    expect(byTestId(build('copied'), 'api-token-copied').length).toBe(1);
    expect(byTestId(build('copied'), 'api-token-copy-failed').length).toBe(0);
  });

  it('shows a visible failure message after a failed copy', function() {
    expect(byTestId(build('failed'), 'api-token-copy-failed').length).toBe(1);
  });

  it('shows no copy status before any copy', function() {
    expect(byTestId(build(), 'api-token-copied').length).toBe(0);
    expect(byTestId(build(), 'api-token-copy-failed').length).toBe(0);
  });
});
