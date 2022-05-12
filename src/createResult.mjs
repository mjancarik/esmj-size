import zlib from 'node:zlib';
import { promisify } from 'node:util';

import fs from 'fs-extra';

import { SPEED } from './constant.mjs';

export async function createResult({ TMP }) {
  const file = await fs.readFile(`${TMP}/blank.bundle.js`);
  const gzipFile = await promisify(zlib.gzip)(file, { level: 9 });
  const brotliFile = await promisify(zlib.brotliCompress)(file, {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
  });

  const result = {
    minify: {
      size: file.toString().length,
      speed: {},
    },
    gzip: {
      size: gzipFile.toString().length,
      speed: {},
    },
    brotli: {
      size: brotliFile.toString().length,
      speed: {},
    },
  };

  Object.keys(result).forEach((type) => {
    Object.keys(SPEED).forEach((wifi) => {
      result[type].speed[wifi] = result[type].size / SPEED[wifi];
    });
  });

  return result;
}
