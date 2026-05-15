import Table from 'cli-table3';

import { SPEED } from './constant.mjs';
import { formatDate, formatNumber, formatSize, formatTime } from './format.mjs';

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
      'source',
      'downloads day / week / month',
      'version',
      'license',
      'created',
      'updated',
      'unpacked size',
    ],
    colWidths: [20, 10, 30, 10, 10, 15, 15, 15],
  });

  packages.forEach((packageName) => {
    const packageData = result[packageName];
    const downloads = packageData.downloads
      ? `${formatNumber(packageData.downloads.day)} / ${formatNumber(
          packageData.downloads.week,
        )} / ${formatNumber(packageData.downloads.month)}`
      : '- / - / -';

    timeTable.push([
      packageName,
      packageData.source || 'npm',
      downloads,
      packageData.info?.version,
      packageData.info?.license,
      formatDate(packageData.info?.created),
      formatDate(packageData.info?.updated),
      formatSize(packageData.info?.unpackedSize),
    ]);
  });

  console.log(timeTable.toString());
}

function parseStats(stats, { withReasons = false } = {}) {
  const info = stats.toJson({
    modules: true,
    assets: false,
    timings: true,
    reasons: withReasons,
    source: false,
    chunks: false,
    chunkGroups: false,
  });

  const allModules = (info.modules ?? []).flatMap((m) =>
    m.modules ? m.modules : [m],
  );

  const builtModules = allModules.filter(
    (m) =>
      !m.orphan &&
      m.name &&
      !/^\(webpack\)/.test(m.name) &&
      !/^webpack\//.test(m.name) &&
      m.name.includes('node_modules'),
  );
  const orphanModules = allModules.filter((m) => m.orphan);

  const packageSizes = new Map();
  const packageDetails = withReasons ? new Map() : null;

  for (const mod of builtModules) {
    const match = mod.name.match(
      /node_modules\/((?:@[^/\\]+[/\\][^/\\]+)|[^/\\]+)/,
    );
    const pkg = match ? match[1].replace(/\\/g, '/') : mod.name;

    const entry = packageSizes.get(pkg) ?? { size: 0, count: 0 };
    entry.size += mod.size ?? 0;
    entry.count += 1;
    packageSizes.set(pkg, entry);

    if (packageDetails) {
      const fileMatch = mod.name.match(/node_modules\/(.+)/);
      const file = fileMatch ? fileMatch[1] : mod.name;
      const importers = [
        ...new Set(
          (mod.reasons ?? [])
            .map((r) => r.moduleName || r.moduleIdentifier)
            .filter(Boolean)
            .map((n) => {
              const m = n.match(/node_modules\/(.+)/);
              return m ? m[1] : n;
            })
            .filter((n) => !n.startsWith('(webpack)')),
        ),
      ];
      const details = packageDetails.get(pkg) ?? [];
      details.push({ file, size: mod.size ?? 0, importers });
      packageDetails.set(pkg, details);
    }
  }

  const sorted = [...packageSizes.entries()].sort(
    (a, b) => b[1].size - a[1].size,
  );

  return { info, sorted, orphanModules, packageDetails };
}

function printExplainTables({ info, sorted, orphanModules }) {
  const totalOrphanSize = orphanModules.reduce(
    (acc, m) => acc + (m.size ?? 0),
    0,
  );

  console.log(
    `\nBuild time: ${info.time} ms | Built: ${sorted.reduce((n, [, { count }]) => n + count, 0)} modules | Orphaned: ${orphanModules.length} modules (${formatSize(totalOrphanSize)})\n`,
  );

  const table = new Table({
    head: ['Module', 'Size', 'Files'],
    colWidths: [55, 15, 8],
  });

  for (const [pkg, { size, count }] of sorted) {
    table.push([pkg, formatSize(size), count]);
  }

  console.log(table.toString());

  if (orphanModules.length) {
    const sortedOrphans = [...orphanModules]
      .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
      .slice(0, 20);

    const orphanTable = new Table({
      head: ['Orphaned module (not in bundle)', 'Size'],
      colWidths: [65, 15],
    });

    for (const mod of sortedOrphans) {
      const match = mod.name.match(/node_modules\/(.+)/);
      const name = match ? `node_modules/${match[1]}` : mod.name;
      orphanTable.push([name, formatSize(mod.size ?? 0)]);
    }

    console.log('\nOrphaned modules (not included in bundle):');
    console.log(orphanTable.toString());

    if (orphanModules.length > 20) {
      console.log(`  ...and ${orphanModules.length - 20} more`);
    }
  }
}

export function renderExplainTable({ stats }) {
  const { info, sorted, orphanModules } = parseStats(stats);
  printExplainTables({ info, sorted, orphanModules });
}

export async function renderInteractiveExplainTable({ stats }) {
  const { info, sorted, orphanModules, packageDetails } = parseStats(stats, {
    withReasons: true,
  });
  printExplainTables({ info, sorted, orphanModules });

  if (process.stdout.isTTY && sorted.length > 0) {
    await showModuleDetails(sorted, packageDetails);
  }
}

async function showModuleDetails(sorted, packageDetails) {
  const { createInterface } = await import('node:readline');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (prompt) =>
    new Promise((resolve) => rl.question(prompt, resolve));

  console.log('\n--- Module drill-down (press Enter to exit) ---');

  while (true) {
    const options = sorted
      .map(([pkg, { size }], i) => `  ${i + 1}. ${pkg} (${formatSize(size)})`)
      .join('\n');
    const answer = await ask(
      `\nSelect module (1-${sorted.length}) or Enter to exit:\n${options}\n> `,
    );

    if (!answer.trim()) break;

    const idx = Number.parseInt(answer.trim(), 10) - 1;
    if (Number.isNaN(idx) || idx < 0 || idx >= sorted.length) {
      console.log('Invalid selection, try again.');
      continue;
    }

    const [pkg] = sorted[idx];
    const files = [...(packageDetails.get(pkg) ?? [])].sort(
      (a, b) => b.size - a.size,
    );

    console.log(`\n${pkg} — file breakdown:`);
    const detailTable = new Table({
      head: ['File', 'Size', 'Imported by'],
      colWidths: [42, 12, 48],
    });

    for (const { file, size, importers } of files) {
      detailTable.push([
        file,
        formatSize(size),
        importers.length ? importers.slice(0, 3).join('\n') : '(entry)',
      ]);
    }
    console.log(detailTable.toString());
  }

  rl.close();
}
