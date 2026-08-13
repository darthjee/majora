import CharacterPossessions from './shared/CharacterPossessions.jsx';

/**
 * PC Possessions index page.
 *
 * @returns {React.ReactElement} PC possessions page element.
 */
export default function PcCharacterPossessions() {
  return <CharacterPossessions characterKind="pcs" listType="pc-possessions" isPc />;
}
