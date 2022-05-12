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

describe('createResult', () => {
  it('should generate result object', async () => {
    const result = await module.createResult({ TMP: 'folder' });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "brotli": Object {
          "size": 33,
          "speed": Object {
            "2g": 2.75,
            "3g": 0.66,
            "4g": 0.037714285714285714,
            "5g": 0.014666666666666666,
          },
        },
        "gzip": Object {
          "size": 122,
          "speed": Object {
            "2g": 10.166666666666666,
            "3g": 2.44,
            "4g": 0.13942857142857143,
            "5g": 0.05422222222222222,
          },
        },
        "minify": Object {
          "size": 26000,
          "speed": Object {
            "2g": 2166.6666666666665,
            "3g": 520,
            "4g": 29.714285714285715,
            "5g": 11.555555555555555,
          },
        },
      }
    `);
  });
});
