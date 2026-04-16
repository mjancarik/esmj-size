import os from 'node:os';
import path from 'node:path';

import uid from 'easy-uid';
import { execa } from 'execa';
import fs from 'fs-extra';

function resolvePackageName({ imp }) {
  let importPath = imp;
  const importParts = imp.split('/');
  const signParts = imp.split('@');

  if (imp.startsWith('@') && signParts.length === 3) {
    importPath = `@${signParts[1]}`;
  }

  if (imp.startsWith('@') && signParts.length === 2) {
    importPath = `@${signParts[1]}`;
  }

  if (!imp.startsWith('@') && signParts.length === 2) {
    importPath = `${signParts[0]}`;
  }

  if (imp.startsWith('@')) {
    return importParts.length > 2
      ? `${importParts[0]}/${importParts[1]}`
      : importPath;
  }

  return importParts.length > 1 ? importParts[0] : importPath;
}

function resolveInstallPackage({ imp }) {
  const importParts = imp.split('/');
  const signParts = imp.split('@');

  if (
    (imp.startsWith('@') && signParts.length === 3) ||
    signParts.length === 2
  ) {
    return imp;
  }

  if (imp.startsWith('@')) {
    return importParts.length > 2 ? `${importParts[0]}/${importParts[1]}` : imp;
  }

  return importParts.length > 1 ? importParts[0] : imp;
}

export async function createIndex({ packages, TMP, options }) {
  let indexImports = [];

  if (options?.code) {
    indexImports = [options.code.trim()];
  } else {
    indexImports = packages.map((imp) => {
      const moduleName = `x${uid()}`;
      return `export * as ${moduleName} from '${imp}';`;
    });
  }

  return await fs.writeFile(`${TMP}/blank.js`, indexImports.join('\n'));
}

export async function installDependencies({ installPackages, options, TMP }) {
  const installArgs = [
    'install',
    '--save',
    '--ignore-scripts',
    '--bin-links=false',
  ].concat(installPackages);

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

export async function getLocalModules({
  localPaths = [],
  cwd = process.cwd(),
}) {
  const localModules = [];
  const seenNames = new Set();

  for (const localPath of localPaths) {
    const normalizedPath = localPath.trim();
    const resolvedPath = path.resolve(cwd, normalizedPath);
    const packageJsonPath = path.join(resolvedPath, 'package.json');

    if (!(await fs.pathExists(resolvedPath))) {
      throw new Error(`Local module path does not exist: ${resolvedPath}`);
    }

    const localPathStat = await fs.stat(resolvedPath);
    if (!localPathStat.isDirectory()) {
      throw new Error(`Local module path must be a directory: ${resolvedPath}`);
    }

    if (!(await fs.pathExists(packageJsonPath))) {
      throw new Error(
        `Local module must contain package.json: ${resolvedPath}`,
      );
    }

    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    if (!packageJson.name) {
      throw new Error(
        `Local module package.json must define name: ${packageJsonPath}`,
      );
    }

    if (seenNames.has(packageJson.name)) {
      throw new Error(
        `Duplicated local module name detected: ${packageJson.name}`,
      );
    }

    seenNames.add(packageJson.name);

    localModules.push({
      inputPath: normalizedPath,
      resolvedPath,
      name: packageJson.name,
      packageJson,
      installSpecifier: `file:${resolvedPath}`,
    });
  }

  return localModules;
}

export function getPackages({ imports, localModules = [] }) {
  const packages = imports.map((imp) => resolvePackageName({ imp }));
  return Array.from(
    new Set(
      packages.concat(localModules.map((localModule) => localModule.name)),
    ),
  );
}

export function getInstallPackages({ imports, localModules = [] }) {
  const installPackages = imports.map((imp) => resolveInstallPackage({ imp }));
  return Array.from(
    new Set(
      installPackages.concat(
        localModules.map((localModule) => localModule.installSpecifier),
      ),
    ),
  );
}
