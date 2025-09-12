import os from 'node:os';
import path from 'node:path';

import uid from 'easy-uid';
import { execa } from 'execa';
import fs from 'fs-extra';

export async function createIndex({ imports, TMP, options }) {
  let indexImports = [];

  if (options?.code) {
    indexImports = [options.code.trim()];
  } else {
    indexImports = imports.map((imp) => {
      const moduleName = `x${uid()}`;
      return `export * as ${moduleName} from '${imp}';`;
    });
  }

  return await fs.writeFile(`${TMP}/blank.js`, indexImports.join('\n'));
}

export async function installDependencies({ packages, options, TMP }) {
  const installArgs = [
    'install',
    '--save',
    '--ignore-scripts',
    '--bin-links=false',
  ].concat(packages);

  if (options.registry) {
    installArgs.push('--registry', options.registry);
  }

  return await execa('npm', installArgs, { cwd: TMP });
}

export async function createEmptyModule() {
  const TMP = path.join(os.tmpdir(), uid());
  //const TMP = path.resolve(path.join('./', 'tmp'));
  await fs.remove(TMP);
  await fs.mkdir(TMP);

  const emptyPackage = {
    name: 'blank',
    private: true,
    license: 'MIT',
  };
  await fs.writeFile(
    path.join(TMP, 'package.json'),
    JSON.stringify(emptyPackage),
    'utf8',
  );

  await fs.writeFile(path.join(TMP, 'LICENSE.md'), '', 'utf8');

  return { TMP };
}

export function getPackages({ imports }) {
  const packages = imports.map((imp) => {
    const importParts = imp.split('/');
    if (imp.startsWith('@')) {
      return importParts.length > 2
        ? `${importParts[0]}/${importParts[1]}`
        : imp;
    }

    return importParts.length > 1 ? importParts[0] : imp;
  });

  return Array.from(new Set(packages));
}
