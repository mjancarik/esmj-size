import Table from 'cli-table3';

import { formatSize, formatTime, formatNumber, formatDate } from './format.mjs';
import { SPEED } from './constant.mjs';

export async function renderSizeTable({ result, packages }) {
  const sizeTable = new Table({
    head: ['Package', 'Minify', 'Minify+Gzip', 'Minify+Brotli'],
    colWidths: [40, 20, 20, 20],
  });

  sizeTable.push([
    packages.join(),
    formatSize(result.bundle.minify.size),
    formatSize(result.bundle.gzip.size),
    formatSize(result.bundle.brotli.size),
  ]);

  console.log(sizeTable.toString());
}

export async function renderTimeTable({ result }) {
  const timeTable = new Table({
    head: ['Bundle', '2g', '3g', '4g', '5g'],
    colWidths: [20, 20, 20, 20, 20],
  });

  Object.keys(result.bundle).forEach((type) => {
    Object.keys(SPEED).forEach((wifi) => {
      result.bundle[type].speed[wifi] = result.bundle[type].size / SPEED[wifi];
    });

    timeTable.push([
      type,
      formatTime(result.bundle[type].speed['2g']),
      formatTime(result.bundle[type].speed['3g']),
      formatTime(result.bundle[type].speed['4g']),
      formatTime(result.bundle[type].speed['5g']),
    ]);
  });

  console.log(timeTable.toString());
}

export async function renderPackageInfo({ result, packages }) {
  const timeTable = new Table({
    head: [
      'package',
      'downloads day / week / month',
      'version',
      'license',
      'created',
      'updated',
      'unpacked size',
    ],
    colWidths: [20, 30, 10, 10, 15, 15, 15],
  });

  packages.forEach((packageName) => {
    const packageData = result[packageName];
    timeTable.push([
      packageName,
      `${formatNumber(packageData.downloads.day)} / ${formatNumber(
        packageData.downloads.week,
      )} / ${formatNumber(packageData.downloads.month)}`,
      packageData.info.version,
      packageData.info.license,
      formatDate(packageData.info.created),
      formatDate(packageData.info.updated),
      formatSize(packageData.info.unpackedSize),
    ]);
  });

  console.log(timeTable.toString());
}
