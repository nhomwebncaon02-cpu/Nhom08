/** Đổi Date -> 'YYYY-MM-DD' theo giờ địa phương của server (tránh lệch múi giờ khi JSON hoá) */
export function toYMD(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Ngày hôm nay dạng 'YYYY-MM-DD' */
export const todayYMD = () => toYMD(new Date());

/** 'YYYY-MM-DD' -> giá trị lưu vào cột DATETIME lúc 00:00:00 giờ địa phương */
export const ymdToDateTime = (ymd: string) => `${ymd.slice(0, 10)} 00:00:00`;
