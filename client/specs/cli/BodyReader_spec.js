import { Readable } from 'node:stream';
import { BodyReader } from '../../src/cli/BodyReader.js';
import { UsageError } from '../../src/core/errors/UsageError.js';
import { fakeStdin } from '../support/FakeStreams.js';

describe('BodyReader', () => {
  let readFile;
  let reader;

  const expectUsage = async (promise, message) => {
    await expectAsync(promise).toBeRejectedWith(jasmine.objectContaining({ message }));
    await expectAsync(promise).toBeRejectedWithError(UsageError);
  };

  beforeEach(() => {
    readFile = jasmine.createSpy('readFile');
    reader = new BodyReader({ stdin: fakeStdin('{"name":"Bob"}'), readFile });
  });

  describe('inline JSON', () => {
    it('parses an object', async () => {
      expect(await reader.read('{"name":"Bob","tags":[1]}')).toEqual({ name: 'Bob', tags: [1] });
    });

    it('rejects invalid JSON without echoing it', async () => {
      const promise = reader.read('{"name": secret}');

      await expectUsage(promise, 'Invalid --data: inline --data is not valid JSON');
    });

    [['an array', '[1, 2]'], ['null', 'null'], ['a string', '"x"'], ['a number', '12'], ['a boolean', 'true']]
      .forEach(([label, text]) => {
        it(`rejects ${label}`, async () => {
          await expectUsage(reader.read(text), 'Invalid --data: inline --data must be a JSON object');
        });
      });

    it('treats an empty value as invalid JSON', async () => {
      await expectUsage(reader.read(''), 'Invalid --data: inline --data is not valid JSON');
    });
  });

  describe('@file', () => {
    it('reads and parses the file', async () => {
      readFile.and.resolveTo('{"name":"From file"}');

      expect(await reader.read('@/tmp/body.json')).toEqual({ name: 'From file' });
      expect(readFile).toHaveBeenCalledWith('/tmp/body.json', 'utf8');
    });

    it('rejects a missing file', async () => {
      readFile.and.rejectWith(Object.assign(new Error('ENOENT: no such file'), { code: 'ENOENT' }));

      await expectUsage(reader.read('@/nope.json'), 'Invalid --data: cannot read file /nope.json (ENOENT)');
    });

    it('rejects a read error without code', async () => {
      readFile.and.rejectWith(new Error('boom'));

      await expectUsage(reader.read('@/x.json'), 'Invalid --data: cannot read file /x.json (read error)');
    });

    it('rejects an empty path', async () => {
      await expectUsage(reader.read('@'), 'Invalid --data: missing file path after @');
      expect(readFile).not.toHaveBeenCalled();
    });

    it('rejects invalid JSON in the file without echoing it', async () => {
      readFile.and.resolveTo('not json mjr_secret');

      await expectUsage(reader.read('@/x.json'), 'Invalid --data: file /x.json is not valid JSON');
    });

    it('rejects a non-object file', async () => {
      readFile.and.resolveTo('[]');

      await expectUsage(reader.read('@/x.json'), 'Invalid --data: file /x.json must be a JSON object');
    });

    it('uses fs by default', async () => {
      reader = new BodyReader();

      await expectUsage(reader.read('@/definitely/missing/body.json'),
        'Invalid --data: cannot read file /definitely/missing/body.json (ENOENT)');
    });
  });

  describe('- (stdin)', () => {
    it('reads and parses stdin', async () => {
      expect(await reader.read('-')).toEqual({ name: 'Bob' });
    });

    it('joins several chunks', async () => {
      reader = new BodyReader({ stdin: Readable.from(['{"na', 'me":', '"Al"}']) });

      expect(await reader.read('-')).toEqual({ name: 'Al' });
    });

    it('rejects invalid JSON on stdin', async () => {
      reader = new BodyReader({ stdin: fakeStdin('nope') });

      await expectUsage(reader.read('-'), 'Invalid --data: stdin is not valid JSON');
    });

    it('rejects a non-object on stdin', async () => {
      reader = new BodyReader({ stdin: fakeStdin('null') });

      await expectUsage(reader.read('-'), 'Invalid --data: stdin must be a JSON object');
    });

    it('rejects without stdin', async () => {
      reader = new BodyReader();

      await expectUsage(reader.read('-'), 'Invalid --data: stdin is not available');
    });

    it('rejects a failing stdin', async () => {
      const stdin = new Readable({
        read() {
          this.destroy(Object.assign(new Error('EIO'), { code: 'EIO' }));
        },
      });

      reader = new BodyReader({ stdin });

      await expectUsage(reader.read('-'), 'Invalid --data: cannot read stdin (EIO)');
    });

    it('rejects a failing stdin without code', async () => {
      const stdin = {
        [Symbol.asyncIterator]() {
          return { next: () => Promise.reject(new Error('boom')) };
        },
      };

      reader = new BodyReader({ stdin });

      await expectUsage(reader.read('-'), 'Invalid --data: cannot read stdin (read error)');
    });
  });

  describe('.parse', () => {
    it('defaults the source to inline --data', () => {
      expect(() => BodyReader.parse('[]')).toThrowError(UsageError, 'Invalid --data: inline --data must be a JSON object');
    });
  });
});
