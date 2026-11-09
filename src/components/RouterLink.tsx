import {Link as RRLink} from 'react-router-dom';
import type {ComponentProps} from 'react';

// Adapter so every Astryx link/nav item does client-side routing.
// Astryx hands the custom component `href` (and sometimes `to`); React Router wants `to`.
type Props = Omit<ComponentProps<'a'>, 'href'> & {href?: string; to?: string};

// Only these schemes may reach a raw <a href>. Anything else (javascript:, data:, vbscript:, ...)
// renders as inert text. Astryx already filters these before calling us; this is defence in depth.
const EXTERNAL_OK = /^(https?:|mailto:|tel:)/i;
const HAS_SCHEME = /^[a-z][a-z0-9+.\-]*:/i;

export function RouterLink({href, to, ...rest}: Props) {
  const target = (to ?? href ?? '').trim();
  if (target.startsWith('#')) return <a href={target} {...rest} />;
  if (target.startsWith('//')) return <a {...rest} />; // protocol-relative: not an app route, don't follow
  if (HAS_SCHEME.test(target)) {
    return EXTERNAL_OK.test(target) ? <a href={target} {...rest} /> : <a {...rest} />;
  }
  if (!target) return <a {...rest} />;
  return <RRLink to={target} {...rest} />;
}
