import zlib from 'node:zlib';
import { promisify } from 'node:util';

import fs from 'fs-extra';
import got from 'got';

import { SPEED, API, PERIOD } from './constant.mjs';

export async function createBundleResult({ TMP }) {
  const file = await fs.readFile(`${TMP}/blank.bundle.js`);
  const gzipFile = await promisify(zlib.gzip)(file, { level: 9 });
  const brotliFile = await promisify(zlib.brotliCompress)(file, {
    [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
    [zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY,
  });

  const result = {
    bundle: {
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
    },
  };

  Object.keys(result.bundle).forEach((type) => {
    Object.keys(SPEED).forEach((wifi) => {
      result.bundle[type].speed[wifi] = result.bundle[type].size / SPEED[wifi];
    });
  });

  return result;
}

export async function createDownloadsResult({ packages, result }) {
  for (let packageName of packages) {
    const [day, week, month] = await Promise.all(
      Object.keys(PERIOD).map((key) => {
        return got
          .get(`${API.NPM_DOWNLOADS}/${PERIOD[key]}/${packageName}`)
          .json();
      })
    ).catch(() => {
      return [{ downloads: 0 }, { downloads: 0 }, { downloads: 0 }];
    });

    result[packageName] = {
      ...result[packageName],
      downloads: {
        day: day.downloads,
        week: week.downloads,
        month: month.downloads,
      },
    };
  }

  return result;
}

export async function createPackageInfo({ packages, result, options }) {
  for (let packageName of packages) {
    const packageInfo = await got
      .get(`${options.registry ?? API.REGISTRY_PACKAGE_INFO}/${packageName}`)
      .json()
      .catch(() => {
        return {
          license: undefined,
          created: undefined,
          modified: undefined,
          latest: undefined,
          unpackedSize: undefined,
        };
      });

    result[packageName] = {
      ...result[packageName],
      info: {
        license: packageInfo.license,
        created: new Date(packageInfo.time.created),
        updated: new Date(packageInfo.time.modified),
        version: packageInfo['dist-tags'].latest,
        unpackedSize:
          packageInfo.versions[packageInfo['dist-tags'].latest]?.dist
            ?.unpackedSize,
      },
    };
  }

  return result;
}
