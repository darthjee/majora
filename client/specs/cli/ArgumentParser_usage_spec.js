import { ArgumentParser } from '../../src/cli/ArgumentParser.js';
import { UsageError } from '../../src/core/errors/UsageError.js';

describe('ArgumentParser usage errors', () => {
  let parser;

  const parse = (...argv) => parser.parse(argv);
  const expectUsage = (argv, message) => {
    expect(() => parser.parse(argv)).toThrowMatching(
      (error) => error instanceof UsageError && (typeof message === 'string'
        ? error.message.includes(message) : message.test(error.message)),
    );
  };

  beforeEach(() => {
    parser = new ArgumentParser({ env: {} });
  });

  it('fails without a resource', () => {
    expectUsage([], /Missing resource/);
  });

  it('fails on an unknown resource', () => {
    expectUsage(['links', 'list'], /Unknown resource: links/);
  });

  it('fails on an inherited property name', () => {
    expectUsage(['constructor', 'list'], /Unknown resource/);
  });

  it('fails without an action', () => {
    expectUsage(['npcs'], /Missing action for npcs/);
  });

  it('fails on an unknown action', () => {
    expectUsage(['npcs', 'delete', '1', '--game', 'g'], /Unknown action for npcs: delete/);
  });

  it('fails on pcs create', () => {
    expectUsage(['pcs', 'create', '--game', 'g', '--data', '{}'], /Unknown action for pcs: create/);
  });

  it('fails on mine for a game-scoped resource', () => {
    expectUsage(['npcs', 'mine', '--game', 'g'], /Unknown action/);
  });

  it('fails on get without an id', () => {
    expectUsage(['npcs', 'get', '--game', 'g'], /Missing <id> for get/);
  });

  it('fails on games get without a slug', () => {
    expectUsage(['games', 'get'], /Missing <id>/);
  });

  it('fails on update without an id', () => {
    expectUsage(['npcs', 'update', '--game', 'g', '--data', '{}'], /Missing <id> for update/);
  });

  it('fails on an empty id', () => {
    expectUsage(['npcs', 'get', '', '--game', 'g'], /Missing <id>/);
  });

  it('fails on an id given to list', () => {
    expectUsage(['npcs', 'list', '12', '--game', 'g'], /Unexpected argument: 12/);
  });

  it('fails on extra positionals after the id', () => {
    expectUsage(['npcs', 'get', '12', '13', '--game', 'g'], /Unexpected argument: 13/);
  });

  it('fails on an unknown flag', () => {
    expectUsage(['npcs', 'list', '--bogus'], /Unknown option '--bogus'/);
  });

  it('fails on a value given to a boolean flag', () => {
    expectUsage(['npcs', 'list', '--all=yes'], /does not take an argument/);
  });

  it('fails on a missing flag value', () => {
    expectUsage(['npcs', 'list', '--game'], /argument missing/);
  });

  it('rejects --token with a hint', () => {
    expectUsage(['games', 'list', '--token', 'mjr_secret'], /There is no --token flag/);
  });

  it('rejects --token=value without echoing it', () => {
    expect(() => parser.parse(['games', 'list', '--token=mjr_secret'])).toThrowMatching(
      (error) => error instanceof UsageError && !error.message.includes('mjr_secret'),
    );
  });

  ['list', 'get'].forEach((action) => {
    it(`fails on --data with ${action}`, () => {
      const argv = action === 'get' ? ['npcs', 'get', '1'] : ['npcs', 'list'];

      expectUsage([...argv, '--game', 'g', '--data', '{}'], `--data is not allowed on ${action}`);
    });
  });

  it('fails on --data with mine', () => {
    expectUsage(['games', 'mine', '--data', '{}'], /--data is not allowed on mine/);
  });

  it('fails on create without --data', () => {
    expectUsage(['npcs', 'create', '--game', 'g'], /Missing --data for create/);
  });

  it('fails on update without --data', () => {
    expectUsage(['npcs', 'update', '1', '--game', 'g'], /Missing --data for update/);
  });

  it('fails on --all with --page', () => {
    expectUsage(['npcs', 'list', '--game', 'g', '--all', '--page', '2'], /--all cannot be combined with --page/);
  });

  it('fails on a --query without =', () => {
    expectUsage(['npcs', 'list', '--game', 'g', '--query', 'name'], /--query must be key=value/);
  });

  it('fails on a --query with an empty key', () => {
    expectUsage(['npcs', 'list', '--game', 'g', '--query', '=x'], /--query must be key=value/);
  });

  [
    ['page', 'x', 'a positive'], ['page', '0', 'a positive'], ['page', '1.5', 'a positive'],
    ['per-page', '-1', 'a positive'], ['timeout', 'abc', 'a non-negative'],
    ['retries', '-2', 'a non-negative'], ['retries', '1e3', 'a non-negative'],
    ['timeout', '99999999999999999999', 'a non-negative'],
  ].forEach(([flag, value, kind]) => {
    it(`fails on --${flag} ${value}`, () => {
      expectUsage(['npcs', 'list', '--game', 'g', `--${flag}=${value}`], `--${flag} must be ${kind}`);
    });
  });

  it('accepts --timeout 0', () => {
    expect(parse('games', 'list', '--timeout', '0').options.timeout).toEqual(0);
  });
});
