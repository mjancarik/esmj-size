import path from 'node:path';

import ora from 'ora';
import fs from 'fs-extra';
import { program } from 'commander';

import { renderSizeTable, renderTimeTable } from './reporter.mjs';
import { bundle, getExternals } from './webpack.mjs';
import {
  createEmptyModule,
  createIndex,
  installDependencies,
} from './createModule.mjs';
import { createResult } from './createResult.mjs';

const dir = path.resolve('./');
let packageJson = null;
try {
  packageJson = JSON.parse(fs.readFileSync(`${dir}/package.json`, 'utf8'));
} catch (_) {
  packageJson = {
    version: '0.0.1',
  };
}

program
  .name(packageJson.name)
  .description('JavaScript package size cost')
  .version(packageJson.version)
  .argument('<packages>')
  .option('--registry', 'npm registry URL')
  .option('--external', 'external dependencies to webpack config')
  .option('--explain', 'log webpack stats')
  .option('--json', 'log only json format')
  .option(
    '--bundle',
    'bundle all dependencies with external dependencies and tree shaking'
  );

program.parse(process.argv);

(async (args, options) => {
  const packages = args[0].split(',');

  let spinner = !options.json && ora('Create project').start();
  const { TMP } = await createEmptyModule();
  await createIndex({ TMP, packages, options });
  !options.json && spinner.succeed();

  try {
    spinner = !options.json && ora('Install dependencies').start();
    await installDependencies({ options, TMP, packages });
    !options.json && spinner.succeed();

    spinner = !options.json && ora('Build bundle').start();
    const externals = await getExternals({ options, packages, TMP });
    const stats = await bundle({ options, externals, TMP });
    !options.json && spinner.succeed();

    if (options.explain) {
      console.log(
        stats.toString({
          colors: true,
        })
      );
    }

    const result = await createResult({ TMP });

    //await fs.remove(TMP);

    await (!options.json && renderSizeTable({ result, packages }));
    await (!options.json && renderTimeTable({ result }));

    if (options.json) {
      console.log(result);
    }
  } catch (error) {
    console.error(error);
    //await fs.remove(TMP);
  }
})(program.args, program.opts());
