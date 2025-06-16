import { formatDate } from '../../utils/formatDate';

describe('formatDate', () => {
  it('Date オブジェクトを yyyy-MM-dd 形式の文字列に変換する', () => {
    const date = new Date('2024-03-15');
    expect(formatDate(date)).toBe('2024-03-15');
  });

  it('日付文字列を yyyy-MM-dd 形式の文字列に変換する', () => {
    expect(formatDate('2024-03-15')).toBe('2024-03-15');
  });

  it('異なる日付形式の文字列も正しく変換する', () => {
    expect(formatDate('2024/03/15')).toBe('2024-03-15');
    expect(formatDate('2024-3-5')).toBe('2024-03-05');
  });

  it('無効な日付文字列の場合、RangeError をスローする', () => {
    expect(() => formatDate('invalid-date')).toThrow(RangeError);
  });

  it('タイムゾーンに関係なく日付部分のみを返す', () => {
    const date = new Date('2024-03-15T12:34:56+09:00');
    expect(formatDate(date)).toBe('2024-03-15');
  });
});