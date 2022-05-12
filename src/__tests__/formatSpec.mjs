import '@jest/globals';
import { formatSize, formatTime } from '../format';

describe('format', () => {
  describe('formatTime', () => {
    it('should return 1 s', () => {
      expect(formatTime(1000)).toEqual('1 s');
    });

    it('should return 1.5 s', () => {
      expect(formatTime(1500)).toEqual('1.5 s');
    });

    it('should return 500 ms', () => {
      expect(formatTime(500)).toEqual('500 ms');
    });

    it('should return 1 ms for less than 1', () => {
      expect(formatTime(0.1)).toEqual('1 ms');
    });

    it('should return 0 s', () => {
      expect(formatTime(0)).toEqual('0 s');
    });
  });

  describe('formatsize', () => {
    it('should return 0 Byte', () => {
      expect(formatSize(0)).toEqual('0 Byte');
    });

    it('should return 500 Bytes', () => {
      expect(formatSize(500)).toEqual('500 Bytes');
    });

    it('should return 1 KB', () => {
      expect(formatSize(1024)).toEqual('1 KB');
    });

    it('should return 1.5 KB', () => {
      expect(formatSize(1536)).toEqual('1.5 KB');
    });

    it('should return 1 MB', () => {
      expect(formatSize(1024 * 1024)).toEqual('1 MB');
    });
  });
});
