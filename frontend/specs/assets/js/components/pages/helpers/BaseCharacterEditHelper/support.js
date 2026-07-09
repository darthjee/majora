import BaseCharacterEditHelper from '../../../../../../../assets/js/components/pages/helpers/BaseCharacterEditHelper.jsx';

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
  onAllegianceChange: jasmine.createSpy('onAllegianceChange'),
  onPublicAllegianceChange: jasmine.createSpy('onPublicAllegianceChange'),
});

export const buildState = (overrides = {}) => ({
  name: 'Test Character',
  profile_photo_path: null,
  links: [],
  role: 'Fighter',
  description: 'A brave warrior.',
  privateDescription: 'DM notes.',
  money: '0',
  allegiance: 'neutral',
  publicAllegiance: 'neutral',
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

  return findElement(node.props?.children, matcher);
};
