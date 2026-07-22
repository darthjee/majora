import GameCoverPhoto from '../../../../../../../../../assets/js/components/resources/game/pages/elements/show/GameCoverPhoto.jsx';
import ActionsOverlay from '../../../../../../../../../assets/js/components/common/misc/ActionsOverlay.jsx';

describe('GameCoverPhoto', function() {
  const buildProps = (overrides = {}) => ({
    cover_photo_path: 'http://example.com/cover.png',
    name: 'Epic Quest',
    can_edit: false,
    mode: 'show',
    handlers: { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') },
    ...overrides,
  });

  it('renders an ActionsOverlay with the cover photo url and alt text', function() {
    const element = GameCoverPhoto(buildProps());

    expect(element.type).toBe(ActionsOverlay);
    expect(element.props.url).toBe('http://example.com/cover.png');
    expect(element.props.alt).toBe('Epic Quest');
  });

  it('gates editing by can_edit in show mode', function() {
    expect(GameCoverPhoto(buildProps({ mode: 'show', can_edit: true })).props.canEdit).toBe(true);
    expect(GameCoverPhoto(buildProps({ mode: 'show', can_edit: false })).props.canEdit).toBe(false);
  });

  it('is always editable in edit mode, regardless of can_edit', function() {
    expect(GameCoverPhoto(buildProps({ mode: 'edit', can_edit: false })).props.canEdit).toBe(true);
  });

  it('wires the upload click handler to handlers.onOpenUploadModal', function() {
    const handlers = { onOpenUploadModal: jasmine.createSpy('onOpenUploadModal') };
    const element = GameCoverPhoto(buildProps({ handlers }));

    element.props.onClick();

    expect(handlers.onOpenUploadModal).toHaveBeenCalled();
  });
});
