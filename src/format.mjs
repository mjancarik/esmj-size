export function formatSize(bytes) {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  if (bytes == 0) {
    return '0 Byte';
  }

  const index = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));

  return (
    Math.round((bytes / Math.pow(1024, index) + Number.EPSILON) * 100) / 100 +
    ' ' +
    sizes[index]
  );
}

export function formatTime(time) {
  const units = ['ms', 's'];

  if (time == 0) {
    return '0 s';
  }

  const index = parseInt(Math.floor(Math.log(time) / Math.log(1000)));

  if (index < 0) {
    return '1 ms';
  }

  return (
    Math.round((time / Math.pow(1000, index) + Number.EPSILON) * 100) / 100 +
    ' ' +
    units[index]
  );
}
