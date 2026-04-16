import { jest } from '@jest/globals';

jest.mock('fs-extra', () => {
  return {
    readFile: () => {
      return 'abcdefghijklmnopqrstuvwxyz'.repeat(1000);
    },
  };
});

let module;

beforeAll(async () => {
  module = await import('../createResult.mjs');
});

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('createResult', () => {
  it('should generate result object', async () => {
    const result = await module.createBundleResult({ TMP: 'folder' });

    expect(result).toMatchInlineSnapshot(`
      {
        "bundle": {
          "brotli": {
            "size": 33,
            "speed": {
              "2g": 2.75,
              "3g": 0.66,
              "4g": 0.037714285714285714,
              "5g": 0.014666666666666666,
            },
          },
          "gzip": {
            "size": 122,
            "speed": {
              "2g": 10.166666666666666,
              "3g": 2.44,
              "4g": 0.13942857142857143,
              "5g": 0.05422222222222222,
            },
          },
          "minify": {
            "size": 26000,
            "speed": {
              "2g": 2166.6666666666665,
              "3g": 520,
              "4g": 29.714285714285715,
              "5g": 11.555555555555555,
            },
          },
        },
      }
    `);
  });

  it('should skip npm downloads for local modules', async () => {
    const result = await module.createDownloadsResult({
      packages: ['@scope/local-module'],
      result: {},
      localModules: [
        {
          name: '@scope/local-module',
          resolvedPath: '/repo/local-module',
          packageJson: {
            name: '@scope/local-module',
            version: '1.0.0',
            license: 'MIT',
          },
        },
      ],
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      '@scope/local-module': {
        source: 'local',
      },
    });
  });

  it('should create local package info from local package.json metadata', async () => {
    const result = await module.createPackageInfo({
      packages: ['@scope/local-module'],
      result: {},
      options: {},
      localModules: [
        {
          name: '@scope/local-module',
          resolvedPath: '/repo/local-module',
          packageJson: {
            name: '@scope/local-module',
            version: '1.0.0',
            license: 'MIT',
          },
        },
      ],
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result).toEqual({
      '@scope/local-module': {
        source: 'local',
        localPath: '/repo/local-module',
        info: {
          license: 'MIT',
          created: undefined,
          updated: undefined,
          version: '1.0.0',
          unpackedSize: undefined,
        },
      },
    });
  });
});
