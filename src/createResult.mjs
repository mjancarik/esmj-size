import { promisify } from 'node:util';
import zlib from 'node:zlib';

import fs from 'fs-extra';

import { API, PERIOD, SPEED } from './constant.mjs';

function getLocalModuleMap({ localModules = [] }) {
  return new Map(localModules.map((module) => [module.name, module]));
}

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

export async function createDownloadsResult({
  packages,
  result,
  localModules = [],
}) {
  const localModuleMap = getLocalModuleMap({ localModules });

  for (const packageName of packages) {
    if (localModuleMap.has(packageName)) {
      result[packageName] = {
        ...result[packageName],
        source: 'local',
      };
      continue;
    }

    const [day, week, month] = await Promise.all(
      Object.keys(PERIOD).map((key) => {
        return fetch(`${API.NPM_DOWNLOADS}/${PERIOD[key]}/${packageName}`).then(
          (response) => response.json(),
        );
      }),
    ).catch(() => {
      return [{ downloads: 0 }, { downloads: 0 }, { downloads: 0 }];
    });

    result[packageName] = {
      ...result[packageName],
      source: 'npm',
      downloads: {
        day: day.downloads,
        week: week.downloads,
        month: month.downloads,
      },
    };
  }

  return result;
}

export async function createPackageInfo({
  packages,
  result,
  options,
  localModules = [],
}) {
  const localModuleMap = getLocalModuleMap({ localModules });

  for (const packageName of packages) {
    const localModule = localModuleMap.get(packageName);
    if (localModule) {
      result[packageName] = {
        ...result[packageName],
        source: 'local',
        localPath: localModule.resolvedPath,
        info: {
          license: localModule.packageJson.license,
          created: undefined,
          updated: undefined,
          version: localModule.packageJson.version,
          unpackedSize: undefined,
        },
      };

      continue;
    }

    const packageInfo = await fetch(
      `${options.registry ?? API.REGISTRY_PACKAGE_INFO}/${packageName}`,
    )
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        throw new Error('Package info is not loaded.');
      })
      .catch((error) => {
        console.error(error);
        return {
          license: undefined,
          time: {
            created: undefined,
            modified: undefined,
          },
          'dist-tags': {
            latest: undefined,
          },
          unpackedSize: undefined,
          versions: {},
        };
      });

    result[packageName] = {
      ...result[packageName],
      source: 'npm',
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
