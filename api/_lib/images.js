// Only the small JPEGs produced by the profile cropper are accepted.
export function validHeadshot(value) {
  if (value === '' || value == null) return true;
  if (typeof value !== 'string' || value.length > 180000 || value.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) return false;
  const bytes = Buffer.from(value, 'base64');
  if (bytes.toString('base64') !== value || bytes.length < 4) return false;
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes.at(-2) !== 0xff || bytes.at(-1) !== 0xd9) return false;
  // Require a JPEG start-of-frame with bounded dimensions, not just a magic prefix.
  for (let i = 2; i + 8 < bytes.length;) {
    if (bytes[i] !== 0xff) return false;
    const marker = bytes[i + 1];
    const size = bytes.readUInt16BE(i + 2);
    if (size < 2 || i + 2 + size > bytes.length) return false;
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      const height = bytes.readUInt16BE(i + 5), width = bytes.readUInt16BE(i + 7);
      return size >= 8 && width > 0 && height > 0 && width <= 1024 && height <= 1024;
    }
    if (marker === 0xda) return false;
    i += 2 + size;
  }
  return false;
}

// Apply the same boundary to older stored values as to new uploads.
export function safeHeadshot(value) {
  return typeof value === 'string' && validHeadshot(value) ? value : '';
}
