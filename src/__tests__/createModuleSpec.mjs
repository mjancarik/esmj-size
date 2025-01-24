import { jest } from '@jest/globals';

const remove = jest.fn();
const mkdir = jest.fn();
const writeFile = jest.fn();
const execa = jest.fn();

jest.mock('fs-extra', () => {
  return {
    remove,
    mkdir,
    writeFile,
  };
});

jest.mock('easy-uid', () => {
  return () => '123';
});

jest.unstable_mockModule('execa', () => {
  return {
    __esModule: true,
    execa,
  };
});

let module;

beforeAll(async () => {
  module = await import('../createModule.mjs');
});

describe('createModule', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('createEmptyModule', () => {
    it('should create empty module structure to TMP folder', async () => {
      const { TMP } = await module.createEmptyModule();

      expect(remove).toHaveBeenCalledWith(TMP);
      expect(mkdir).toHaveBeenCalledWith(TMP);

      expect(writeFile.mock.calls[0][0]).toEqual(
        expect.stringContaining('package.json'),
      );
      expect(writeFile.mock.calls[1][0]).toEqual(
        expect.stringContaining('LICENSE.md'),
      );

      expect(TMP).toEqual(expect.any(String));
    });
  });

  describe('installDependencies', () => {
    it('should install defined modules from npm registry', async () => {
      await module.installDependencies({
        TMP: 'folder',
        packages: ['react', 'react-dom'],
        options: {},
      });

      expect(execa.mock.calls[0]).toEqual([
        'npm',
        [
          'install',
          '--save',
          '--ignore-scripts',
          '--bin-links=false',
          'react',
          'react-dom',
        ],
        { cwd: 'folder' },
      ]);
    });
  });

  describe('createIndex', () => {
    it('should create index file with imported defined packages', async () => {
      await module.createIndex({
        TMP: 'folder',
        imports: ['react', 'react-dom'],
      });

      expect(writeFile.mock.calls[0][0]).toEqual(
        expect.stringContaining('blank.js'),
      );
      expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
        "export * as x123 from 'react';
        export * as x123 from 'react-dom';"
      `);
    });
  });
});
