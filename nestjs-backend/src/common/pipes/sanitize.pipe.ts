import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';

/**
 * SanitizePipe — chống XSS (Stored XSS) ở tầng đầu vào.
 *
 * Duyệt đệ quy toàn bộ body / query / param, với mọi giá trị kiểu string:
 *   - loại bỏ toàn bộ thẻ HTML (<script>, <img onerror=...>, <iframe>...)
 *   - loại bỏ nội dung nằm trong <script> và <style>
 *   - cắt khoảng trắng 2 đầu
 *
 * Các field mật khẩu KHÔNG bị làm sạch (vì sẽ bị băm, không bao giờ hiển thị lại,
 * và người dùng có quyền dùng ký tự như "<" trong mật khẩu).
 */
const SKIP_KEYS = /password/i;

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
  nonTextTags: ['script', 'style', 'textarea', 'noscript', 'iframe'],
};

export function cleanString(value: string): string {
  // sanitize-html trả về text đã encode entity (&amp; ...) -> decode lại các entity cơ bản
  // để dữ liệu lưu trong DB là text thuần; React sẽ tự escape khi render.
  return sanitizeHtml(value, SANITIZE_OPTIONS)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[<>]/g, '') // không để sót dấu < > lẻ
    .trim();
}

function sanitizeDeep(value: unknown, key?: string): unknown {
  if (typeof value === 'string') {
    return key && SKIP_KEYS.test(key) ? value : cleanString(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeDeep(v));
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = sanitizeDeep(v, k);
    }
    return result;
  }
  return value;
}

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type === 'custom') return value; // bỏ qua @CurrentUser()...
    return sanitizeDeep(value, metadata.data);
  }
}
