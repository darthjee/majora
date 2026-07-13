import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import LinksEditModal from '../../../../../../../../assets/js/components/resources/character/pages/elements/LinksEditModal.jsx';
import LinksEditModalHelper from '../../../../../../../../assets/js/components/resources/character/pages/elements/helpers/LinksEditModalHelper.jsx';
import { buildLink } from '../../../../../../../support/factories.js';

describe('LinksEditModal', function() {
  const links = [
    buildLink({ id: 1, text: 'Wiki', url: 'https://example.com/wiki' }),
  ];

  const renderModal = (props = {}) => {
    let capturedShow;
    let capturedState;
    let capturedHandlers;

    spyOn(LinksEditModalHelper, 'render').and.callFake((show, state, handlers) => {
      capturedShow = show;
      capturedState = state;
      capturedHandlers = handlers;
      return React.createElement('div', null, 'modal');
    });

    renderToStaticMarkup(
      React.createElement(LinksEditModal, {
        show: true,
        links,
        onClose: jasmine.createSpy('onClose'),
        onConfirm: jasmine.createSpy('onConfirm'),
        ...props,
      }),
    );

    return { show: capturedShow, state: capturedState, handlers: capturedHandlers };
  };

  it('seeds local state as a clone of the given links prop', function() {
    const { state } = renderModal();

    expect(state.links).toEqual(links);
    expect(state.links).not.toBe(links);
    expect(state.links[0]).not.toBe(links[0]);
  });

  it('forwards the show prop as-is', function() {
    const { show } = renderModal({ show: false });

    expect(show).toBe(false);
  });

  it('handles a null links prop without throwing', function() {
    expect(() => renderModal({ links: null })).not.toThrow();
  });

  it('handles an undefined links prop without throwing', function() {
    expect(() => renderModal({ links: undefined })).not.toThrow();
  });

  it('computes canConfirm as true when every active link has a url', function() {
    const { state } = renderModal();

    expect(state.canConfirm).toBe(true);
  });

  it('computes canConfirm as false when an active link is missing a url', function() {
    const { state } = renderModal({ links: [{ text: '', url: '', link_type: '' }] });

    expect(state.canConfirm).toBe(false);
  });

  it('invokes onClose when the close handler is triggered', function() {
    const onClose = jasmine.createSpy('onClose');
    const { handlers } = renderModal({ onClose });

    handlers.onClose();

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onConfirm with the seeded local links array', function() {
    const onConfirm = jasmine.createSpy('onConfirm');
    const { handlers } = renderModal({ onConfirm });

    handlers.onConfirm();

    expect(onConfirm).toHaveBeenCalledWith(links);
  });

  it('exposes handlers for add/remove/text/url/link_type without throwing', function() {
    const { handlers } = renderModal();

    expect(() => {
      handlers.onAddLink();
      handlers.onToggleDelete(0);
      handlers.onTextChange(0, 'New text');
      handlers.onUrlChange(0, 'https://example.com/new');
      handlers.onLinkTypeChange(0, 'lootstudio');
    }).not.toThrow();
  });
});
