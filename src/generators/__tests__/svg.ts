import svgicons2svgfont from 'svgicons2svgfont';
import { FontType } from '../../types/misc';
import { FontGeneratorOptions } from '../../types/generator';
import svgGen from '../svg';

jest.mock('fs', () => ({
  createReadStream: (filepath: string) => ({
    content: `content->${filepath}`
  })
}));

jest.mock('svgicons2svgfont', () => {
  const { EventEmitter } = require('events');

  class MockStream {
    public events = new EventEmitter();
    public content = '';

    public write(chunk: any) {
      this.events.emit('data', new Buffer(`processed->${chunk.content}$`));
      return this;
    }

    public on(event: string, callback: () => void) {
      this.events.on(event, callback);
      return this;
    }

    public end() {
      this.events.emit('end');
      return this;
    }
  }

  return { default: jest.fn(() => new MockStream()) };
});

const mockOptions = (svgOptions = { __mock: 'options__' } as any) =>
  (({
    fontName: 'foo',
    fontHeight: 1,
    descent: 2,
    normalize: false,
    round: true,
    formatOptions: { [FontType.SVG]: svgOptions },
    codepoints: { foo: 1, bar: 1 },
    assets: {
      foo: { id: 'foo', absolutePath: '/root/foo.svg' },
      bar: { id: 'bar', absolutePath: '/root/bar.svg' }
    }
  } as unknown) as FontGeneratorOptions);

const ttf = ('::ttf::' as unknown) as Buffer;

describe('`SVG` font generator', () => {
  beforeEach(() => {
    svgicons2svgfont.mockClear();
  });

  test('calls done with the correctly with the result of the completed `svgicons2svgfont` stream', () => {
    const done = jest.fn();
    const result = svgGen.generate(mockOptions(), done);

    expect(svgicons2svgfont).toHaveBeenCalledTimes(1);
    expect(svgicons2svgfont).toHaveBeenCalledWith({
      descent: 2,
      fontHeight: 1,
      fontName: 'foo',
      log: expect.any(Function),
      normalize: false,
      round: true,
      __mock: 'options__'
    });

    expect(done).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledWith(
      null,
      'processed->content->/root/foo.svg$processed->content->/root/bar.svg$'
    );
  });

  test('passes correctly format options to `svgicons2svgfont`', () => {
    const log = () => null;
    const formatOptions = { descent: 5, fontHeight: 6, log };
    const result = svgGen.generate(mockOptions(formatOptions), () => null);

    expect(svgicons2svgfont).toHaveBeenCalledTimes(1);
    expect(svgicons2svgfont).toHaveBeenCalledWith({
      descent: 5,
      fontHeight: 6,
      fontName: 'foo',
      log,
      normalize: false,
      round: true
    });
  });
});
