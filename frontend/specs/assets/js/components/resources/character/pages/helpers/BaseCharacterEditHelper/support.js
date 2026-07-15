import BaseCharacterEditHelper from '../../../../../../../../../assets/js/components/resources/character/pages/helpers/BaseCharacterEditHelper.jsx';

export const helper = new BaseCharacterEditHelper('test', 'npc_edit_page');
export const npcHelper = new BaseCharacterEditHelper('npc', 'npc_edit_page');

export const buildHandlers = () => ({
  onSubmit: jasmine.createSpy('onSubmit'),
  onNameChange: jasmine.createSpy('onNameChange'),
  onRoleChange: jasmine.createSpy('onRoleChange'),
  onDescriptionChange: jasmine.createSpy('onDescriptionChange'),
  onPrivateDescriptionChange: jasmine.createSpy('onPrivateDescriptionChange'),
  onMoneyChange: jasmine.createSpy('onMoneyChange'),
  onOpenUploadModal: jasmine.createSpy('onOpenUploadModal'),
  onOpenLinksModal: jasmine.createSpy('onOpenLinksModal'),
  onOpenMoneyModal: jasmine.createSpy('onOpenMoneyModal'),
  onAllegianceChange: jasmine.createSpy('onAllegianceChange'),
  onPublicAllegianceChange: jasmine.createSpy('onPublicAllegianceChange'),
  onPublicSlainChange: jasmine.createSpy('onPublicSlainChange'),
  onHiddenChange: jasmine.createSpy('onHiddenChange'),
});

export const buildState = (overrides = {}) => ({
  isFullEditor: true,
  name: 'Test Character',
  profile_photo_path: null,
  links: [],
  role: 'Fighter',
  description: 'A brave warrior.',
  privateDescription: 'DM notes.',
  money: '0',
  allegiance: 'neutral',
  publicAllegiance: 'neutral',
  publicSlain: false,
  hidden: false,
  status: 'idle',
  fieldErrors: {},
  ...overrides,
});

export const findElement = (node, matcher) => {
  if (!node) {
    return null;
  }

  if (Array.isArray(node)) {
    for (const child of node) {
      const match = findElement(child, matcher);

      if (match) {
        return match;
      }
    }

    return null;
  }

  if (typeof node !== 'object') {
    return null;
  }

  if (matcher(node)) {
    return node;
  }

  if (typeof node.type === 'function') {
    return findElement(node.type(node.props), matcher);
  }

  return findElement(node.props?.children, matcher);
};
