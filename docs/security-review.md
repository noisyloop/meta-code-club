# Security review: Code Club Hub (Stage 6)

Scope: every file on branch `claude/tender-maxwell-5mhbgx`. Method: read all source, grep for
dangerous sinks, `npm audit`, then verify behaviour in a production build (`vite preview`) with Playwright.

## Result

**No exploitable vulnerabilities found (nothing at or above the report threshold).**

Threat model: a client-only app with no server, accounts, network calls or secrets. Data lives in the
viewer's own `localStorage`. The realistic risks are (a) script injection through user-authored text and
URLs and (b) a future backend returning untrusted data into the same code paths.

| Area | Finding |
| --- | --- |
| HTML injection / XSS | No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, `document.write` anywhere in `src/`. All text is rendered through React. The only rich-text path (challenge prompts) uses Astryx `Markdown`, which URL-sanitises links and images. Verified: a prompt containing `[x](javascript:…)`, `<img onerror>`, `<script>` and `![](javascript:…)` produced 0 script-capable elements and 0 dialogs. |
| URL handling | `repoUrl`/`demoUrl` and submission repo URLs are validated on input (http/https with a dotted host only). |
| Auth / secrets / network | None exist. No keys, tokens, cookies, fetches or third-party scripts. |
| Dependencies | `npm audit`: 0 vulnerabilities. |

## Defence-in-depth added in this stage

1. **Render-time URL allow-list** (`src/lib/safeUrl.ts`): every stored URL that reaches an `href` goes through
   `safeExternalUrl()` (http/https only). Verified with tampered storage (`javascript:` / `data:` URLs): 0 such links rendered.
2. **Untrusted storage boundary** (`src/data/guards.ts`, used by `store.ts`): rows read from storage are shape-checked;
   malformed rows and non-array JSON are dropped instead of crashing the UI or reaching the DOM with the wrong type.
3. **Link adapter** (`src/components/RouterLink.tsx`): only `http(s)`, `mailto`, `tel`, `#anchor` and in-app paths become
   links; any other scheme and protocol-relative URLs render inert.
4. **Content Security Policy** (production build, `vite.config.ts`): `script-src 'self'`, `object-src 'none'`,
   `base-uri 'self'`, `form-action 'self'`, `frame-src 'none'`, `connect-src 'self'`, plus a strict referrer policy.
   Verified: an injected inline script is blocked and the app runs with zero CSP violations.
5. External links set `rel="noopener noreferrer"` explicitly (`Button` does not add it for `target="_blank"`).

## Known residual items (accepted, not vulnerabilities)

- `style-src 'unsafe-inline'` is required because Astryx sets inline `style` attributes. Scripts are not affected.
- The theme's `fonts.css` imports Figtree from Google Fonts, so each visitor's IP reaches Google (privacy, not security).
  Self-hosting the font and dropping the two Google hosts from the CSP would remove this.
- CSP is delivered as a `<meta>` tag. If the app is ever served with real headers, move it there and add `frame-ancestors 'none'`
  (not expressible in a meta tag).
- Anyone with access to the browser profile can read or edit the data: it is not a confidential store. A future backend must
  enforce authentication, authorisation and validation server-side; client-side validation here is for usability only.
