import DescriptionBox from '../../../../../common/misc/DescriptionBox.jsx';

/**
 * Rendering helper for the CharacterDescription element.
 */
export default class CharacterDescriptionHelper {
  /**
   * Render the description box, or null if description is absent.
   *
   * @param {string} [description] - Character description.
   * @returns {React.ReactElement|null} Description box or null.
   */
  static render(description) {
    return <DescriptionBox description={description} />;
  }
}
