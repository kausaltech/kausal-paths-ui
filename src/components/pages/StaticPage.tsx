import styled from '@common/themes/styled';

import type { PageQuery } from '@/common/__generated__/graphql';
import { PageHero } from '@/components/common/PageHero';
import { StreamField } from '@/components/common/StreamField';
import type { PageRefetchCallback } from './Page';

const BodyCard = styled.div`
  padding: 2rem;
  border-radius: ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

type StaticPageData = Extract<NonNullable<PageQuery['page']>, { body: unknown }>;

type StaticPageProps = {
  page: StaticPageData;
  refetch: PageRefetchCallback;
};

function StaticPage({ page }: StaticPageProps) {
  return (
    <PageHero leadTitle={page.title}>
      <BodyCard>
        {page?.body?.map((block) => (block ? <StreamField key={block.id} block={block} /> : null))}
      </BodyCard>
    </PageHero>
  );
}

export default StaticPage;
