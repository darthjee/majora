import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ExchangeDetailPane
  from '../../../../../../../../../../assets/js/components/resources/character/pages/elements/tabs/shared/ExchangeDetailPane.jsx';

describe('ExchangeDetailPane', function() {
  const selected = {
    name: 'Golden Crown', value: 500, photo_path: null,
  };

  const buildProps = (overrides = {}) => ({
    selected,
    quantity: 1,
    owned: 0,
    submitting: false,
    actionError: '',
    onQuantityChange: jasmine.createSpy('onQuantityChange'),
    onConfirm: jasmine.createSpy('onConfirm'),
    onCancel: jasmine.createSpy('onCancel'),
    ...overrides,
  });

  const render = (overrides = {}) => renderToStaticMarkup(
    React.createElement(ExchangeDetailPane, buildProps(overrides))
  );

  it('renders the selected treasure name', function() {
    expect(render()).toContain('Golden Crown');
  });

  it('renders the already-owned count', function() {
    expect(render({ owned: 4 })).toContain('Already owned: 4');
  });

  it('renders the current quantity in the input', function() {
    expect(render({ quantity: 5 })).toContain('value="5"');
  });

  it('applies maxQuantity to the quantity input when given', function() {
    expect(render({ maxQuantity: 3 })).toContain('max="3"');
  });

  it('renders the action error when present', function() {
    expect(render({ actionError: 'treasure_exchange_modal.insufficient_funds' }))
      .toContain('Not enough money to buy this quantity.');
  });

  it('does not render an action error when absent', function() {
    expect(render({ actionError: '' })).not.toContain('alert-danger');
  });

  it('renders both a Confirm and a Cancel button', function() {
    const html = render();

    expect(html).toContain('Confirm');
    expect(html).toContain('Cancel');
  });

  it('disables the Confirm button while submitting', function() {
    expect(render({ submitting: true })).toContain('disabled=""');
  });
});
