import '@jest/globals';
import { formatSize, formatTime, formatNumber, formatDate } from '../format';

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

  describe('formatSize', () => {
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

  describe('formatNumber', () => {
    it('should return 0', () => {
      expect(formatNumber(0)).toEqual('0');
    });

    it('should return 500', () => {
      expect(formatNumber(500)).toEqual('500');
    });

    it('should return 1K', () => {
      expect(formatNumber(1000)).toEqual('1K');
    });

    it('should return 1.5 M', () => {
      expect(formatNumber(1500000)).toEqual('1.5M');
    });
  });

  describe('formatDate', () => {
    it('should return 2022-04-01', () => {
      expect(formatDate(new Date('2022-04-01T09:29:40.128Z'))).toEqual(
        '2022-4-1'
      );
    });

    it('should return 0 seconds ago', () => {
      expect(formatDate(new Date())).toEqual('0 seconds ago');
    });

    it('should return 5 seconds ago', () => {
      expect(formatDate(new Date(Date.now() - 5000))).toEqual('5 seconds ago');
    });

    it('should return 1 minutes ago', () => {
      expect(formatDate(new Date(Date.now() - 60000))).toEqual('1 minutes ago');
    });

    it('should return 1 hours ago', () => {
      expect(formatDate(new Date(Date.now() - 60 * 60000))).toEqual(
        '1 hours ago'
      );
    });

    it('should return 1 days ago', () => {
      expect(formatDate(new Date(Date.now() - 24 * 60 * 60000))).toEqual(
        '1 days ago'
      );
    });
  });
});
