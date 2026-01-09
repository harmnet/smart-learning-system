/**
 * 解码Unicode转义序列
 * @param str 可能包含\uXXXX格式转义序列的字符串
 * @returns 解码后的字符串
 */
export function decodeUnicode(str: string): string {
  if (!str) return str;
  try {
    // 如果字符串包含\uXXXX格式的Unicode转义序列，进行解码
    if (str.includes('\\u')) {
      return JSON.parse(`"${str}"`);
    }
    return str;
  } catch (e) {
    return str;
  }
}

