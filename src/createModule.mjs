import path from 'node:path';
import os from 'node:os';

import fs from 'fs-extra';
import { execa } from 'execa';
import uid from 'easy-uid';

export async function createIndex({ packages, TMP }) {
  const imports = packages.map((packageName) => {
    const moduleName = `x${uid()}`;
    return `export * as ${moduleName} from '${packageName}';`;
  });

  return await fs.writeFile(`${TMP}/blank.js`, imports.join('\n'));
}

export async function installDependencies({ packages, options, TMP }) {
  const installArgs = ['install', '--save', '--ignore-scripts'].concat(
    packages
  );

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
    'utf8'
  );

  await fs.writeFile(path.join(TMP, 'LICENSE.md'), '', 'utf8');

  return { TMP };
}
