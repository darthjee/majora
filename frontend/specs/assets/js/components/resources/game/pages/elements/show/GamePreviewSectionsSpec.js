import GamePreviewSections
  from '../../../../../../../../../assets/js/components/resources/game/pages/elements/show/GamePreviewSections.jsx';
import PreviewSection from '../../../../../../../../../assets/js/components/common/cards/PreviewSection.jsx';
import CharacterPreviewCard from '../../../../../../../../../assets/js/components/common/cards/CharacterPreviewCard.jsx';
import { buildCharacter } from '../../../../../../../../support/factories.js';

describe('GamePreviewSections', function() {
  it('renders a PC preview section linking to the game\'s pcs page', function() {
    const pcs = [buildCharacter({ id: 1, name: 'Aragorn' })];
    const [pcSection] = GamePreviewSections({ game_slug: 'epic-quest', pcs, npcs: [] }).props.children;

    expect(pcSection.type).toBe(PreviewSection);
    expect(pcSection.props.seeAllHref).toBe('#/games/epic-quest/pcs');
    expect(pcSection.props.items).toEqual(pcs);
  });

  it('renders an NPC preview section linking to the game\'s npcs page', function() {
    const npcs = [buildCharacter({ id: 2, name: 'Gandalf' })];
    const [, npcSection] = GamePreviewSections({ game_slug: 'epic-quest', pcs: [], npcs }).props.children;

    expect(npcSection.type).toBe(PreviewSection);
    expect(npcSection.props.seeAllHref).toBe('#/games/epic-quest/npcs');
    expect(npcSection.props.items).toEqual(npcs);
  });

  it('feeds the pc name to the preview card tooltip content', function() {
    const pcs = [buildCharacter({ id: 1, name: 'Aragorn' })];
    const [pcSection] = GamePreviewSections({ game_slug: 'epic-quest', pcs, npcs: [] }).props.children;
    const cardElement = pcSection.props.renderItem(pcs[0]);
    const cardTree = CharacterPreviewCard(cardElement.props);

    expect(cardTree.props.children.props.content).toBe('Aragorn');
  });

  it('feeds the npc name to the preview card tooltip content', function() {
    const npcs = [buildCharacter({ id: 2, name: 'Gandalf' })];
    const [, npcSection] = GamePreviewSections({ game_slug: 'epic-quest', pcs: [], npcs }).props.children;
    const cardElement = npcSection.props.renderItem(npcs[0]);
    const cardTree = CharacterPreviewCard(cardElement.props);

    expect(cardTree.props.children.props.content).toBe('Gandalf');
  });

  it('defaults pcs and npcs to empty lists', function() {
    expect(() => GamePreviewSections({ game_slug: 'epic-quest' })).not.toThrow();
  });
});
