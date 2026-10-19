import { execFile } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const BIN = fileURLToPath(new URL('../../bin/majora.js', import.meta.url));
const { version } = createRequire(import.meta.url)('../../package.json');

function spawnBin(...args) {
  return new Promise((resolve) => {
    execFile(process.execPath, [BIN, ...args], { env: { PATH: process.env.PATH } }, (error, stdout, stderr) => {
      resolve({ code: error ? error.code : 0, stdout, stderr });
    });
  });
}

describe('bin/majora.js', () => {
  it('prints the package version', async () => {
    const { code, stdout, stderr } = await spawnBin('--version');

    expect(code).toEqual(0);
    expect(stdout).toEqual(`${version}\n`);
    expect(stderr).toEqual('');
  });

  it('prints the help', async () => {
    const { code, stdout } = await spawnBin('--help');

    expect(code).toEqual(0);
    expect(stdout).toMatch(/^Usage: majora <resource> <action> \[<id>\] \[flags\]\n/);
  });

  it('exits 2 on a usage error', async () => {
    const { code, stdout, stderr } = await spawnBin('links', 'list');

    expect(code).toEqual(2);
    expect(stdout).toEqual('');
    expect(stderr).toEqual('Unknown resource: links\n');
  });

  it('exits 2 without configuration, before any request', async () => {
    const { code, stderr } = await spawnBin('games', 'mine');

    expect(code).toEqual(2);
    expect(stderr).toContain('Missing baseUrl');
  });
});
