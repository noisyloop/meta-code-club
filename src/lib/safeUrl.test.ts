import {describe, expect, it} from 'vitest';
import {safeExternalUrl} from './safeUrl';

describe('safeExternalUrl', () => {
  it('allows http and https', () => {
    expect(safeExternalUrl('https://github.com/a/b')).toBe('https://github.com/a/b');
    expect(safeExternalUrl('  http://example.com  ')).toBe('http://example.com/');
  });
  it('rejects script-capable and non-web schemes', () => {
    for (const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)', 'data:text/html,<script>1</script>', 'vbscript:x', 'file:///etc/passwd', 'ftp://x.y', 'blob:https://x.y/1']) {
      expect(safeExternalUrl(bad)).toBeUndefined();
    }
  });
  it('rejects relative, empty and malformed values', () => {
    for (const bad of ['', undefined, null, '/members', '//evil.com', 'github.com/x', 'http://']) expect(safeExternalUrl(bad as string)).toBeUndefined();
  });
});
