/**
 * Returns the URL only if it is a plain http(s) link, otherwise undefined.
 * Use for every user- or storage-supplied URL that ends up in an href, so a tampered
 * record (or a future backend returning bad data) can never produce a javascript:/data: link.
 */
export function safeExternalUrl(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  try {
    const u = new URL(value.trim());
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.href : undefined;
  } catch {
    return undefined;
  }
}
