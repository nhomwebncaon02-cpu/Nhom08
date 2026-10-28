import { ValueTransformer } from 'typeorm';

/**
 * MySQL trả cột DECIMAL về dạng chuỗi ("15000000.00").
 * Transformer này đổi về number để API trả JSON số và tính toán được.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value === null || value === undefined ? value : Number(value)),
};
