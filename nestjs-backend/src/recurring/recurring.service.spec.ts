import { addPeriod } from './recurring.service';

describe('addPeriod (tính ngày giao dịch định kỳ tiếp theo)', () => {
  it('hằng ngày / hằng tuần', () => {
    expect(addPeriod('2026-10-31', 'daily')).toBe('2026-11-01');
    expect(addPeriod('2026-12-28', 'weekly')).toBe('2027-01-04');
  });

  it('hằng tháng: 31/1 -> 28/2 (tháng ngắn hơn thì lấy ngày cuối tháng)', () => {
    expect(addPeriod('2026-01-31', 'monthly')).toBe('2026-02-28');
    expect(addPeriod('2026-10-05', 'monthly')).toBe('2026-11-05');
  });

  it('hằng năm: 29/2 năm nhuận -> 28/2', () => {
    expect(addPeriod('2028-02-29', 'yearly')).toBe('2029-02-28');
  });
});
