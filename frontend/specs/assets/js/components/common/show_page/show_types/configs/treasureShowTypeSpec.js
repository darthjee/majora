import treasureShowType
  from '../../../../../../../../assets/js/components/common/show_page/show_types/configs/treasureShowType.js';
import TreasureFormTitle
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/show/TreasureFormTitle.jsx';
import TreasureNameField
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/show/TreasureNameField.jsx';
import TreasureValueFieldSlot
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/show/TreasureValueFieldSlot.jsx';
import TreasureMaxUnitsField
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/show/TreasureMaxUnitsField.jsx';
import TreasureSubmitButton
  from '../../../../../../../../assets/js/components/resources/treasure/pages/elements/show/TreasureSubmitButton.jsx';

describe('treasureShowType', function() {
  it('has no left-column content', function() {
    expect(treasureShowType.left).toEqual([]);
  });

  it('has no bottom-slot content', function() {
    expect(treasureShowType.bottom).toEqual([]);
  });

  it('shares the title between new and edit', function() {
    const titleEntry = treasureShowType.right.find((entry) => entry.New === TreasureFormTitle);

    expect(titleEntry.Edit).toBe(TreasureFormTitle);
  });

  it('shares the name field between new and edit', function() {
    const nameEntry = treasureShowType.right.find((entry) => entry.New === TreasureNameField);

    expect(nameEntry.Edit).toBe(TreasureNameField);
  });

  it('shares the value field between new and edit', function() {
    const valueEntry = treasureShowType.right.find((entry) => entry.New === TreasureValueFieldSlot);

    expect(valueEntry.Edit).toBe(TreasureValueFieldSlot);
  });

  it('only offers the max units field in edit mode', function() {
    const maxUnitsEntry = treasureShowType.right.find((entry) => entry.Edit === TreasureMaxUnitsField);

    expect(maxUnitsEntry.New).toBeUndefined();
    expect(maxUnitsEntry.Show).toBeUndefined();
  });

  it('shares the submit button between new and edit', function() {
    const submitEntry = treasureShowType.right.find((entry) => entry.New === TreasureSubmitButton);

    expect(submitEntry.Edit).toBe(TreasureSubmitButton);
  });
});
