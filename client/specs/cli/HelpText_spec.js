import { HelpText } from '../../src/cli/HelpText.js';

describe('HelpText', () => {
  describe('.global', () => {
    const text = HelpText.global();

    it('shows the grammar', () => {
      expect(text).toContain('Usage: majora <resource> <action> [<id>] [flags]');
    });

    it('lists every resource and its actions', () => {
      expect(text).toMatch(/games\s+list, mine, get\n/);
      expect(text).toMatch(/npcs\s+list, get, create, update \(needs --game\)/);
      expect(text).toMatch(/pcs\s+list, get, update \(needs --game\)/);
      ['factions', 'items', 'documents'].forEach((name) => expect(text).toContain(`  ${name} `));
    });

    it('lists every flag and no --token flag', () => {
      [
        '--url', '--token-file', '--allow-insecure-http', '--game', '--restricted', '--page',
        '--per-page', '--all', '--meta', '--query', '--data', '--timeout', '--retries', '--debug',
        '--help', '--version',
      ].forEach((flag) => expect(text).toContain(flag));
      expect(text).not.toMatch(/^ +--token[ ,<]/m);
    });

    it('lists the environment variables', () => {
      ['MAJORA_URL', 'MAJORA_TOKEN', 'MAJORA_GAME'].forEach((name) => expect(text).toContain(name));
    });

    it('lists the exit codes', () => {
      expect(text).toMatch(/ {2}130 {2}Interrupted \(SIGINT\)/);
      expect(text).toMatch(/ {2}9 +NetworkError/);
    });

    it('ends with a newline', () => {
      expect(text.endsWith('\n')).toBeTrue();
    });
  });

  describe('.resource', () => {
    it('describes a game-scoped resource', () => {
      const text = HelpText.resource('npcs');

      expect(text).toContain('Usage: majora npcs <action> --game <slug> [flags]');
      expect(text).toContain('Needs --game <slug> (or MAJORA_GAME).');
      expect(text).toContain('get <id>');
      expect(text).toContain('create --data <json|@file|->');
      expect(text).toContain('update <id> --data <json|@file|->');
    });

    it('describes pcs without create', () => {
      expect(HelpText.resource('pcs')).not.toMatch(/^ +create/m);
    });

    it('describes games with a slug and no --game', () => {
      const text = HelpText.resource('games');

      expect(text).toContain('Usage: majora games <action> [flags]');
      expect(text).toContain('get <slug>');
      expect(text).toContain('mine');
      expect(text).toContain('--game is ignored');
    });

    it('throws for an unknown resource', () => {
      expect(() => HelpText.resource('links')).toThrowError(/Unknown resource: links/);
    });
  });
});
