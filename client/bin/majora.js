#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { Cli } from '../src/cli/Cli.js';

const cli = new Cli({
  env: process.env,
  stdin: process.stdin,
  stdout: process.stdout,
  stderr: process.stderr,
  fetch: globalThis.fetch,
  readFile,
});

process.once('SIGINT', () => cli.abort());
process.exitCode = await cli.run(process.argv.slice(2));
