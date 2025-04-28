import module from 'node:module';

import fs from 'fs-extra';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';

const require = module.createRequire(import.meta.url);

export async function bundle({ options, externals, TMP }) {
  const config = {
    name: 'web',
    target: 'web',
    stats: 'verbose',
    bail: true,
    mode: 'production',
    devtool: false,
    entry: {
      blank: `${TMP}/blank.js`,
    },
    resolve: {
      alias: {},
      extensions: ['.mjs', '.js', '.jsx', '.json'],
      modules: [`${TMP}/node_modules`, `${TMP}`],
    },
    externals: options.bundle ? [] : externals,
    externalsPresets: { node: true },
    output: {
      path: TMP,
      filename: '[name].bundle.js',
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: './blank.css',
      }),
    ],
    performance: {
      hints: false,
    },
    module: {
      rules: [
        {
          test: /\.(le|c)ss$/,
          sideEffects: true,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: require.resolve('css-loader'),
              options: {
                modules: {
                  auto: true,
                  localIdentName: '[path][name]__[local]--[hash:base64:5]',
                },
              },
            },
            {
              loader: require.resolve('postcss-loader'),
              options: {
                postcssOptions: {
                  plugins: [
                    [
                      'postcss-preset-env',
                      {
                        browsers:
                          'last 2 versions, last 1 year, not safari 12.1',
                        autoprefixer: {
                          flexbox: 'no-2009',
                        },
                        stage: 3,
                        features: {
                          'custom-properties': false,
                        },
                      },
                    ],
                  ],
                },
              },
            },
          ],
        },
        {
          test: /\.mjs$/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false,
          },
        },
        {
          test: /\.svg$/,
          loader: 'svg-inline-loader',
        },
      ],
    },
    optimization: {
      minimize: true,
      runtimeChunk: options.bundle ? undefined : 'single',
      usedExports: !!options.bundle,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: false,
            },
          },
          extractComments: false,
        }),
      ],
    },
  };

  const stats = await new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        console.error(err.stack || err);
        if (err.details) {
          console.error(err.details);
        }

        reject(err);
        return;
      }

      const info = stats.toJson();

      if (stats.hasErrors()) {
        console.error(info.errors);
      }

      if (stats.hasWarnings()) {
        console.warn(info.warnings);
      }

      resolve(stats);
    });
  });

  return stats;
}

export async function getExternals({ options, packages, TMP }) {
  let externals = [];

  for (const packageName of packages) {
    const packageFile = await fs.readFile(
      `${TMP}/node_modules/${packageName}/package.json`,
    );
    let packageJSON = null;

    try {
      packageJSON = JSON.parse(packageFile);
    } catch (error) {
      console.error(error);
      packageJSON = {};
    }
    externals = [
      ...externals,
      ...(packageJSON.peerDependencies
        ? Object.keys(packageJSON.peerDependencies)
        : []),
    ];
  }

  if (options.externals) {
    externals = Array.isArray(options.externals)
      ? options.externals
      : [options.externals];
  }

  externals = externals.filter((external) => {
    return !packages.includes(external);
  });

  return [
    ({ request }, callback) => {
      if (externals.includes(request)) {
        return callback(null, `commonjs ${request}`);
      }

      callback();
    },
  ];
}
