import { jest } from '@jest/globals';

const remove = jest.fn();
const mkdir = jest.fn();
const writeFile = jest.fn();
const pathExists = jest.fn();
const stat = jest.fn();
const readFile = jest.fn();
const execa = jest.fn();

jest.mock('fs-extra', () => {
  return {
    remove,
    mkdir,
    writeFile,
    pathExists,
    stat,
    readFile,
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
    it('should create an empty module structure in the TMP folder', async () => {
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
    it('should install the specified modules from the npm registry', async () => {
      await module.installDependencies({
        TMP: 'folder',
        installPackages: ['react', 'react-dom'],
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
    it('should create an index file with imported specified packages', async () => {
      await module.createIndex({
        TMP: 'folder',
        packages: ['react', 'react-dom'],
      });

      expect(writeFile.mock.calls[0][0]).toEqual(
        expect.stringContaining('blank.js'),
      );
      expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(`
        "export * as x123 from 'react';
        export * as x123 from 'react-dom';"
      `);
    });

    it('should create an index file with a code snippet for the packages', async () => {
      await module.createIndex({
        TMP: 'folder',
        packages: ['react', 'react-dom'],
        options: {
          code: 'export { useState } from "react"; export { useEffect } from "react-dom";console.log(useState,useEffect);',
        },
      });

      expect(writeFile.mock.calls[0][0]).toEqual(
        expect.stringContaining('blank.js'),
      );
      expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(
        `"export { useState } from "react"; export { useEffect } from "react-dom";console.log(useState,useEffect);"`,
      );
    });

    it('should create an index file with imported specified packages and version', async () => {
      await module.createIndex({
        TMP: 'folder',
        packages: ['@esmj/monitor'],
      });

      expect(writeFile.mock.calls[0][0]).toEqual(
        expect.stringContaining('blank.js'),
      );
      expect(writeFile.mock.calls[0][1]).toMatchInlineSnapshot(
        `"export * as x123 from '@esmj/monitor';"`,
      );
    });
  });

  describe('getInstallPackages', () => {
    it('should return an array of packages when given a string', () => {
      const result = module.getInstallPackages({ imports: ['react'] });
      expect(result).toEqual(['react']);
    });

    it('should return the same array when given an array of packages', () => {
      const input = ['react', 'react-dom'];
      const result = module.getInstallPackages({ imports: input });
      expect(result).toEqual(input);
    });

    it('should return package names with their versions', () => {
      const input = [
        '@esmj/monitor',
        '@esmj/emitter@latest',
        '@esmj/size@1.2.3',
        'to-mock@rc',
      ];
      const result = module.getInstallPackages({ imports: input });
      expect(result).toEqual([
        '@esmj/monitor',
        '@esmj/emitter@latest',
        '@esmj/size@1.2.3',
        'to-mock@rc',
      ]);
    });

    it('should include local file specifiers with npm dependencies', () => {
      const result = module.getInstallPackages({
        imports: ['react'],
        localModules: [
          {
            installSpecifier: 'file:/repo/local-module',
          },
        ],
      });

      expect(result).toEqual(['react', 'file:/repo/local-module']);
    });
  });

  describe('getPackages', () => {
    it('should return an array of packages when given a string', () => {
      const result = module.getPackages({ imports: ['react'] });
      expect(result).toEqual(['react']);
    });

    it('should return the same array when given an array of packages', () => {
      const input = ['react', 'react-dom'];
      const result = module.getPackages({ imports: input });
      expect(result).toEqual(input);
    });

    it('should trim package versions', () => {
      const input = [
        '@esmj/monitor',
        '@esmj/emitter@latest',
        '@esmj/size@1.2.3',
        'to-mock@rc',
      ];
      const result = module.getPackages({ imports: input });
      expect(result).toEqual([
        '@esmj/monitor',
        '@esmj/emitter',
        '@esmj/size',
        'to-mock',
      ]);
    });

    it('should include local package names with npm dependencies', () => {
      const result = module.getPackages({
        imports: ['react'],
        localModules: [
          {
            name: '@scope/local-module',
          },
        ],
      });

      expect(result).toEqual(['react', '@scope/local-module']);
    });
  });

  describe('getLocalModules', () => {
    it('should resolve current directory local module from dot path', async () => {
      pathExists.mockResolvedValue(true);
      stat.mockResolvedValue({
        isDirectory: () => true,
      });
      readFile.mockResolvedValue(
        JSON.stringify({
          name: '@scope/local-package',
          version: '1.0.0',
          license: 'MIT',
        }),
      );

      const localModules = await module.getLocalModules({
        localPaths: ['.'],
        cwd: '/repo/project',
      });

      expect(localModules).toEqual([
        {
          inputPath: '.',
          resolvedPath: '/repo/project',
          name: '@scope/local-package',
          packageJson: {
            name: '@scope/local-package',
            version: '1.0.0',
            license: 'MIT',
          },
          installSpecifier: 'file:/repo/project',
        },
      ]);
    });

    it('should throw when local path does not exist', async () => {
      pathExists.mockResolvedValue(false);

      await expect(
        module.getLocalModules({
          localPaths: ['./missing'],
          cwd: '/repo/project',
        }),
      ).rejects.toThrow('Local module path does not exist');
    });
  });
});
