import Table from 'cli-table3';

import { formatSize, formatTime } from './format.mjs';
import { SPEED } from './constant.mjs';

export async function renderSizeTable({ result, packages }) {
  const sizeTable = new Table({
    head: ['Package', 'Minify', 'Minify+Gzip', 'Minify+Brotli'],
    colWidths: [40, 20, 20, 20],
  });

  sizeTable.push([
    packages.join(),
    formatSize(result.minify.size),
    formatSize(result.gzip.size),
    formatSize(result.brotli.size),
  ]);

  console.log(sizeTable.toString());
}

export async function renderTimeTable({ result }) {
  const timeTable = new Table({
    head: ['Bundle', '2g', '3g', '4g', '5g'],
    colWidths: [20, 20, 20, 20, 20],
  });

  Object.keys(result).forEach((type) => {
    Object.keys(SPEED).forEach((wifi) => {
      result[type].speed[wifi] = result[type].size / SPEED[wifi];
    });

    timeTable.push([
      type,
      formatTime(result[type].speed['2g']),
      formatTime(result[type].speed['3g']),
      formatTime(result[type].speed['4g']),
      formatTime(result[type].speed['5g']),
    ]);
  });

  console.log(timeTable.toString());
}
