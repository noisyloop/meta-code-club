import type {ReactNode} from 'react';
import {Layout, LayoutContent, LayoutHeader} from '@astryxdesign/core/Layout';
import {HStack, VStack, StackItem} from '@astryxdesign/core/Stack';
import {Heading} from '@astryxdesign/core/Text';
import {Breadcrumbs, BreadcrumbItem} from '@astryxdesign/core/Breadcrumbs';

export interface Crumb {
  label: string;
  href?: string;
}

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
                <Heading level={1}>{title}</Heading>
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
