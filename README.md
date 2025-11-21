# JavaScript Page Size Cost

The `@esmj/size` show you javascript cost for your defined packages. The packages is bundled with Webpack. Then show the bundle size and downloaded time for javascript bundle.

## Requirements

- Node 20+

## Install

```shell
npm install -g @esmj/size
esmj-size @merkur/core
// or
npx @esmj/size @merkur/core
```

## Usage

```shell

esmj-size react,react-dom

# ┌────────────────────────────────────────┬────────────────────┬────────────────────┬────────────────────┐
# │ Package                                │ Minify             │ Minify+Gzip        │ Minify+Brotli      │
# ├────────────────────────────────────────┼────────────────────┼────────────────────┼────────────────────┤
# │ react,react-dom                        │ 136.28 KB          │ 41.49 KB           │ 36.03 KB           │
# └────────────────────────────────────────┴────────────────────┴────────────────────┴────────────────────┘
# ┌────────────────────┬────────────────────┬────────────────────┬────────────────────┬────────────────────┐
# │ Bundle             │ 2g                 │ 3g                 │ 4g                 │ 5g                 │
# ├────────────────────┼────────────────────┼────────────────────┼────────────────────┼────────────────────┤
# │ minify             │ 11.63 s            │ 2.79 s             │ 159.48 ms          │ 62.02 ms           │
# ├────────────────────┼────────────────────┼────────────────────┼────────────────────┼────────────────────┤
# │ gzip               │ 3.54 s             │ 849.76 ms          │ 48.56 ms           │ 18.88 ms           │
# ├────────────────────┼────────────────────┼────────────────────┼────────────────────┼────────────────────┤
# │ brotli             │ 3.07 s             │ 737.82 ms          │ 42.16 ms           │ 16.4 ms            │
# └────────────────────┴────────────────────┴────────────────────┴────────────────────┴────────────────────┘
# ┌────────────────────┬──────────────────────────────┬──────────┬──────────┬───────────────┬───────────────┬───────────────┐
# │ package            │ downloads day / week / month │ version  │ license  │ created       │ updated       │ unpacked size │
# ├────────────────────┼──────────────────────────────┼──────────┼──────────┼───────────────┼───────────────┼───────────────┤
# │ react              │ 2.36M / 15.26M / 64.29M      │ 18.1.0   │ MIT      │ 2011-10-26    │ 1 days ago    │ 308.05 KB     │
# ├────────────────────┼──────────────────────────────┼──────────┼──────────┼───────────────┼───────────────┼───────────────┤
# │ react-dom          │ 2.18M / 14.03M / 59.02M      │ 18.1.0   │ MIT      │ 2014-5-6      │ 1 days ago    │ 4.2 MB        │
# └────────────────────┴──────────────────────────────┴──────────┴──────────┴───────────────┴───────────────┴───────────────┘

esmj-size easy-uid --pretty

# {
#   bundle: {
#     minify: {
#       size: 307,
#       speed: {
#         '2g': 25.583333333333332,
#         '3g': 6.14,
#         '4g': 0.35085714285714287,
#         '5g': 0.13644444444444445
#       }
#     },
#     gzip: {
#       size: 226,
#       speed: {
#         '2g': 18.833333333333332,
#         '3g': 4.52,
#         '4g': 0.2582857142857143,
#         '5g': 0.10044444444444445
#       }
#     },
#     brotli: {
#       size: 180,
#       speed: { '2g': 15, '3g': 3.6, '4g': 0.2057142857142857, '5g': 0.08 }
#     }
#   },
#   'easy-uid': {
#     downloads: { day: 3, week: 38, month: 142 },
#     info: {
#       license: 'ISC',
#       created: 2018-09-07T14:45:00.352Z,
#       updated: 2022-04-30T19:18:42.984Z,
#       version: '2.0.2',
#       unpackedSize: 5196
#     }
#   }
# }
```

## CLI Options

### Basic Options

- `--pretty` - Output the result as a pretty-printed object instead of tables
- `--json` - Output the result in JSON format only
- `--help` - Display all available commands and settings

### Advanced Options

- `--registry` - Specify a custom npm registry URL
- `--external` - Define external dependencies for webpack config (dependencies that should not be bundled)
- `--bundle` - Bundle all dependencies with external dependencies and enable tree shaking
- `--explain` - Display detailed webpack stats output for debugging
- `--code <string>` - Provide a code snippet to analyze instead of package imports

### Examples

**Analyze a specific package version:**
```shell
esmj-size react@17.0.2
esmj-size lodash@4.17.21,moment@2.29.4
```

**Analyze with custom code snippet:**
```shell
esmj-size react --code "import React from 'react'; console.log(React.version);"
```

**Output as JSON:**
```shell
esmj-size lodash --json
```

**Bundle with external dependencies:**
```shell
esmj-size react-dom --external react --bundle
```

**Use custom npm registry:**
```shell
esmj-size @myorg/package --registry https://custom-registry.example.com
```

## Network Speed Reference

The tool calculates download times based on the following network speeds:
- **2g**: 12 KB/s
- **3g**: 50 KB/s
- **4g**: 875 KB/s
- **5g**: 2250 KB/s

You can display all available commands and settings with following command:
```shell
esmj-size --help
```

