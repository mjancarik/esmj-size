import path from 'node:path';
import { URL } from 'node:url';
import util from 'node:util';

import { Command } from 'commander';
import fs from 'fs-extra';
import ora from 'ora';

import {
  createEmptyModule,
  createIndex,
  getPackages,
  installDependencies,
} from './createModule.mjs';
import {
  createBundleResult,
  createDownloadsResult,
  createPackageInfo,
} from './createResult.mjs';
import {
  renderPackageInfo,
  renderSizeTable,
  renderTimeTable,
} from './reporter.mjs';
import { bundle, getExternals } from './webpack.mjs';

const __dirname = new URL('.', import.meta.url).pathname;
const dir = path.resolve(`${__dirname}/../`);
let packageJson = null;
try {
  packageJson = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf8'));
} catch (_) {
  //eslint-disable-line
  packageJson = {
    version: '0.0.1',
  };
}
const program = new Command();

program.name(packageJson.name);
program.description('JavaScript package size cost');
program.version(packageJson.version);
program.argument('<imports>');
program
  .option('--registry', 'npm registry URL')
  .option('--external', 'external dependencies to webpack config')
  .option('--explain', 'log webpack stats')
  .option('--json', 'log only json format')
  .option('--pretty', 'log only pretty print object')
  .option('--code <string>', 'code snippet')
  .option(
    '--bundle',
    'bundle all dependencies with external dependencies and tree shaking',
  );

program.parse(process.argv);
(async (args, options) => {
  const imports = args[0].split(',');
  const packages = getPackages({ imports, options });

  let spinner = !options.json && ora('Create project').start();
  const { TMP } = await createEmptyModule();
  await createIndex({ TMP, imports, options });
  !options.json && spinner.succeed();

  try {
    spinner = !options.json && ora('Install dependencies').start();
    await installDependencies({ options, TMP, packages });
    !options.json && spinner.succeed();

    spinner = !options.json && ora('Build bundle').start();
    const externals = await getExternals({ options, packages, TMP });
    const stats = await bundle({ options, externals, packages, TMP });
    !options.json && spinner.succeed();

    if (options.explain) {
      console.log(
        stats.toString({
          colors: true,
        }),
      );
    }

    let result = await createBundleResult({ TMP });

    await fs.remove(TMP);

    result = await createDownloadsResult({ result, packages });
    result = await createPackageInfo({ result, packages, options });

    await (!options.json &&
      !options.pretty &&
      renderSizeTable({ result, packages }));
    await (!options.json && !options.pretty && renderTimeTable({ result }));
    await (!options.json &&
      !options.pretty &&
      renderPackageInfo({ result, packages }));

    if (options.json) {
      console.log(JSON.stringify(result));
    }

    if (options.pretty) {
      console.log(
        util.inspect(result, { showHidden: false, depth: null, colors: true }),
      );
    }
  } catch (error) {
    console.error(error);
    await fs.remove(TMP);
    !options.json && spinner.fail();
  }
})(program.args, program.opts());
