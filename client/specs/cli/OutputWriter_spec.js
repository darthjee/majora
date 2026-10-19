import { OutputWriter } from '../../src/cli/OutputWriter.js';
import { Page } from '../../src/core/Page.js';
import { FakeWritable } from '../support/FakeStreams.js';

async function* generate(items, onYield = null) {
  for (const item of items) {
    onYield?.(item);
    yield item;
  }
}

describe('OutputWriter', () => {
  let stdout;
  let writer;

  beforeEach(() => {
    stdout = new FakeWritable();
    writer = new OutputWriter(stdout);
  });

  describe('#object', () => {
    it('pretty-prints with 2 spaces and a newline', async () => {
      await writer.object({ id: 1, tags: ['a'] });

      expect(stdout.output).toEqual('{\n  "id": 1,\n  "tags": [\n    "a"\n  ]\n}\n');
    });

    it('prints an array', async () => {
      await writer.object([{ id: 1 }]);

      expect(JSON.parse(stdout.output)).toEqual([{ id: 1 }]);
    });
  });

  describe('#page', () => {
    const page = new Page({ data: [{ id: 1 }, { id: 2 }], page: 2, pages: 3, perPage: 2, total: 6 });

    it('prints the data array', async () => {
      await writer.page(page);

      expect(stdout.output).toEqual(`${JSON.stringify(page.data, null, 2)}\n`);
    });

    it('prints [] for an empty page', async () => {
      await writer.page(new Page({ data: [], page: 1, pages: 1, perPage: 0, total: 0 }));

      expect(stdout.output).toEqual('[]\n');
    });

    it('prints [] when data is missing', async () => {
      await writer.page({});

      expect(stdout.output).toEqual('[]\n');
    });

    it('prints the metadata with --meta', async () => {
      await writer.page(page, { meta: true });

      expect(stdout.output).toEqual(`${JSON.stringify({
        data: page.data, page: 2, pages: 3, perPage: 2, total: 6,
      }, null, 2)}\n`);
    });

    it('prints an empty data array with --meta', async () => {
      await writer.page(new Page({ data: [], page: 1, pages: 1, perPage: 0, total: 0 }), { meta: true });

      expect(JSON.parse(stdout.output)).toEqual({ data: [], page: 1, pages: 1, perPage: 0, total: 0 });
    });
  });

  describe('#stream', () => {
    it('writes one compact JSON line per item', async () => {
      await writer.stream(generate([{ id: 1, name: 'A' }, { id: 2 }]));

      expect(stdout.output).toEqual('{"id":1,"name":"A"}\n{"id":2}\n');
    });

    it('writes nothing for an empty collection', async () => {
      await writer.stream(generate([]));

      expect(stdout.output).toEqual('');
    });

    it('consumes the iterator lazily', async () => {
      const yielded = [];
      const written = [];
      const original = stdout.write.bind(stdout);

      stdout.write = (chunk, callback) => {
        written.push(yielded.length);
        return original(chunk, callback);
      };

      await writer.stream(generate([1, 2, 3], (item) => yielded.push(item)));

      expect(written).toEqual([1, 2, 3]);
    });

    it('waits for drain under back-pressure', async () => {
      stdout.withBackPressure();
      let drains = 0;

      stdout.on('drain', () => { drains += 1; });
      await writer.stream(generate([1, 2]));

      expect(stdout.output).toEqual('1\n2\n');
      expect(drains).toEqual(2);
      expect(stdout.listenerCount('drain')).toEqual(1);
    });
  });

  describe('closed pipe', () => {
    it('rejects with the EPIPE error', async () => {
      stdout.closeAfter(1);

      const promise = writer.stream(generate([1, 2, 3]));

      await expectAsync(promise).toBeRejectedWith(jasmine.objectContaining({ code: 'EPIPE' }));
      expect(stdout.output).toEqual('1\n');
    });

    it('stops the iteration on EPIPE', async () => {
      stdout.closeAfter(1);
      const yielded = [];

      await expectAsync(writer.stream(generate([1, 2, 3], (item) => yielded.push(item)))).toBeRejected();

      expect(yielded).toEqual([1, 2]);
    });

    it('rejects every later write', async () => {
      stdout.closeAfter(0);

      await expectAsync(writer.object({ id: 1 })).toBeRejected();
      await expectAsync(writer.object({ id: 2 })).toBeRejectedWith(jasmine.objectContaining({ code: 'EPIPE' }));
    });

    it('records an error reported only by the write callback', async () => {
      stdout.write = (_chunk, callback) => {
        callback(Object.assign(new Error('destroyed'), { code: 'ERR_STREAM_DESTROYED' }));
        return true;
      };

      await expectAsync(writer.object({ id: 1 })).toBeRejectedWith(
        jasmine.objectContaining({ code: 'ERR_STREAM_DESTROYED' }),
      );
    });

    it('swallows an error emitted after the last write', () => {
      expect(() => stdout.emit('error', Object.assign(new Error('EPIPE'), { code: 'EPIPE' }))).not.toThrow();
    });

    it('resolves the drain wait on close', async () => {
      stdout.write = () => {
        setImmediate(() => stdout.emit('close'));
        return false;
      };

      await expectAsync(writer.object({ id: 1 })).toBeResolved();
    });
  });

  describe('.isClosedPipe', () => {
    it('is true for EPIPE', () => {
      expect(OutputWriter.isClosedPipe({ code: 'EPIPE' })).toBeTrue();
    });

    it('is true for a destroyed stream', () => {
      expect(OutputWriter.isClosedPipe({ code: 'ERR_STREAM_DESTROYED' })).toBeTrue();
    });

    it('is false for other errors', () => {
      expect(OutputWriter.isClosedPipe(new Error('boom'))).toBeFalse();
    });

    it('is false for nothing', () => {
      expect(OutputWriter.isClosedPipe(undefined)).toBeFalse();
    });
  });
});
