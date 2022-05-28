export function formatNumber(number) {
  const sizes = ['', 'K', 'M', 'G', 'T'];

  if (number == 0) {
    return '0';
  }

  const index = parseInt(Math.floor(Math.log(number) / Math.log(1000)));

  return (
    Math.round((number / Math.pow(1000, index) + Number.EPSILON) * 100) / 100 +
    sizes[index]
  );
}

export function formatDate(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 2592000;

  if (interval >= 1) {
    return `${date.getUTCFullYear()}-${
      date.getUTCMonth() + 1
    }-${date.getUTCDate()}`;
  }
  interval = seconds / 86400;
  if (interval >= 1) {
    return Math.floor(interval) + ' days ago';
  }
  interval = seconds / 3600;
  if (interval >= 1) {
    return Math.floor(interval) + ' hours ago';
  }
  interval = seconds / 60;
  if (interval >= 1) {
    return Math.floor(interval) + ' minutes ago';
  }
  return Math.floor(seconds) + ' seconds ago';
}

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
