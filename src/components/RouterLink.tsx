import {Link as RRLink} from 'react-router-dom';
import type {ComponentProps} from 'react';

// Adapter so every Astryx link/nav item does client-side routing.
// Astryx hands the custom component `href` (and sometimes `to`); React Router wants `to`.
type Props = Omit<ComponentProps<'a'>, 'href'> & {href?: string; to?: string};

const isExternal = (url: string) => /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(url);

export function RouterLink({href, to, ...rest}: Props) {
  const target = to ?? href ?? '';
  if (!target || isExternal(target) || target.startsWith('#')) {
    return <a href={target || undefined} {...rest} />;
  }
  return <RRLink to={target} {...rest} />;
}
