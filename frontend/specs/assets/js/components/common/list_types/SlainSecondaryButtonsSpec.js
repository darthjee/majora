import SlainSecondaryButtons from '../../../../../../assets/js/components/common/list_types/SlainSecondaryButtons.js';

describe('SlainSecondaryButtons', function() {
  describe('.buildSlainButton', function() {
    it('builds the Mark as Slain button definition when not slain', function() {
      const onClick = jasmine.createSpy('onClick');
      const button = SlainSecondaryButtons.buildSlainButton(false, onClick);

      expect(button).toEqual({
        label: 'Mark as Slain',
        variant: 'danger',
        icon: 'bi-skull-fill',
        onClick,
      });
    });

    it('builds the Revive button definition when slain', function() {
      const onClick = jasmine.createSpy('onClick');
      const button = SlainSecondaryButtons.buildSlainButton(true, onClick);

      expect(button).toEqual({
        label: 'Revive',
        variant: 'success',
        icon: 'bi-heart-fill',
        onClick,
      });
    });
  });

  describe('.buildPublicSlainButton', function() {
    it('builds the Mark as Publicly Slain button definition when not publicly slain', function() {
      const onClick = jasmine.createSpy('onClick');
      const button = SlainSecondaryButtons.buildPublicSlainButton(false, onClick);

      expect(button).toEqual({
        label: 'Mark as Publicly Slain',
        variant: 'danger',
        icon: 'bi-skull',
        onClick,
      });
    });

    it('builds the Publicly Revive button definition when publicly slain', function() {
      const onClick = jasmine.createSpy('onClick');
      const button = SlainSecondaryButtons.buildPublicSlainButton(true, onClick);

      expect(button).toEqual({
        label: 'Publicly Revive',
        variant: 'success',
        icon: 'bi-heart',
        onClick,
      });
    });
  });

  describe('.buildDmButtons', function() {
    it('builds the real slain/revive button first and the public one second', function() {
      const onSlainClick = jasmine.createSpy('onSlainClick');
      const onPublicSlainClick = jasmine.createSpy('onPublicSlainClick');
      const character = { slain: false, public_slain: true };

      const buttons = SlainSecondaryButtons.buildDmButtons(character, onSlainClick, onPublicSlainClick);

      expect(buttons).toEqual([
        {
          label: 'Mark as Slain',
          variant: 'danger',
          icon: 'bi-skull-fill',
          onClick: onSlainClick,
        },
        {
          label: 'Publicly Revive',
          variant: 'success',
          icon: 'bi-heart',
          onClick: onPublicSlainClick,
        },
      ]);
    });
  });
});
