import CharacterFactions from './shared/CharacterFactions.jsx';

/**
 * PC Factions index page.
 *
 * @returns {React.ReactElement} PC factions page element.
 */
export default function PcCharacterFactions() {
  return <CharacterFactions characterKind="pcs" listType="pc-factions" isPc />;
}
