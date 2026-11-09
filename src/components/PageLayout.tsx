import {useEffect, useRef, type ReactNode} from 'react';
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout';
import {HStack, VStack, StackItem} from '@astryxdesign/core/Stack';
import {Heading} from '@astryxdesign/core/Text';
import {Breadcrumbs, BreadcrumbItem} from '@astryxdesign/core/Breadcrumbs';

export interface Crumb {
  label: string;
  href?: string;
}

// A single-page app doesn't reload on navigation, so screen readers and keyboard users get no cue
// that the page changed. On every route change we set the document title and move focus to the
// page's h1. (Skipped for the very first load so we don't steal focus from the browser.)
let isFirstPage = true;

/** Standard page frame: optional breadcrumbs, h1, header actions, then padded content. */
export function PageLayout({
  title,
  crumbs,
  actions,
  startContent,
  children,
}: {
  title: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  startContent?: ReactNode;
  children: ReactNode;
}) {
  const headingWrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = `${title} · Code Club Hub`;
  }, [title]);

  useEffect(() => {
    if (isFirstPage) {
      isFirstPage = false;
      return;
    }
    headingWrap.current?.focus({preventScroll: true});
  }, []);

  return (
    <Layout
      contentWidth={1200}
      header={
        <LayoutHeader hasDivider>
          <VStack gap={2}>
            {crumbs && (
              <Breadcrumbs variant="supporting">
                {crumbs.map(c => (
                  <BreadcrumbItem key={c.label} href={c.href}>
                    {c.label}
                  </BreadcrumbItem>
                ))}
              </Breadcrumbs>
            )}
            <HStack gap={3} vAlign="center" wrap="wrap">
              {startContent}
              <StackItem size="fill">
                <div ref={headingWrap} tabIndex={-1} style={{outline: 'none'}}>
                  <Heading level={1}>{title}</Heading>
                </div>
              </StackItem>
              {actions && (
                <HStack gap={2} vAlign="center" wrap="wrap">
                  {actions}
                </HStack>
              )}
            </HStack>
          </VStack>
        </LayoutHeader>
      }>
      <LayoutContent>{children}</LayoutContent>
    </Layout>
  );
}
