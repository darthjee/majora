import React from 'react';
import Translator from '../../../../i18n/Translator.js';
import Icons from '../../../../utils/ui/Icons.js';
import Badge from '../../badges/Badge.jsx';
import ConversationCountBadge from '../../badges/ConversationCountBadge.jsx';

/**
 * Rules class deciding which informational badges appear in a `/my-games.json` entry's
 * always-visible info bar, given the raw entry object (`{game, role, character, conversations}`).
 * Builds up to four items: the user's role in that game, the character they play there (omitted
 * for DMs and for players with no character yet), and two conversation-activity counters
 * (followed and unread), each independent of one another.
 */
export default class MyGamesInfoBarRules {
  /**
   * Build the list of info items to display in a `/my-games.json` entry's info bar.
   *
   * @param {object} entry - Raw `/my-games.json` entry.
   * @param {string} entry.role - The user's role in the game (`'dm'` or `'player'`).
   * @param {{name: string}|null} entry.character - The user's character in the game, or null.
   * @param {{count: number, unread_count: number}} entry.conversations - Conversation activity
   *   counts for the game.
   * @returns {{key: string, label: React.ReactElement}[]} Info item definitions to render.
   */
  static build(entry) {
    return [
      MyGamesInfoBarRules.#buildRoleItem(entry.role),
      ...MyGamesInfoBarRules.#buildCharacterItem(entry.character),
      MyGamesInfoBarRules.#buildFollowingItem(entry.conversations),
      MyGamesInfoBarRules.#buildUnreadItem(entry.conversations),
    ];
  }

  static #buildRoleItem(role) {
    const label = role === 'dm' ? Translator.t('my_games.role_dm') : Translator.t('my_games.role_player');

    return {
      key: 'role',
      label: React.createElement(Badge, { text: label }),
    };
  }

  static #buildCharacterItem(character) {
    if (!character) {
      return [];
    }

    return [{
      key: 'character',
      label: React.createElement(Badge, { text: character.name }),
    }];
  }

  static #buildFollowingItem(conversations) {
    const tooltip = Translator.t('my_games.following_tooltip').replace('{{count}}', conversations.count);

    return {
      key: 'following-count',
      label: React.createElement(ConversationCountBadge, {
        icon: Icons.envelope,
        text: conversations.count,
        tooltip,
      }),
    };
  }

  static #buildUnreadItem(conversations) {
    const tooltip = Translator.t('my_games.unread_tooltip').replace('{{count}}', conversations.unread_count);

    return {
      key: 'unread-count',
      label: React.createElement(ConversationCountBadge, {
        icon: Icons.envelopeFill,
        text: conversations.unread_count,
        tooltip,
      }),
    };
  }
}
