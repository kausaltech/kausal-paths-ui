import styled from 'styled-components';

import type { GetPageQuery } from 'common/__generated__/graphql';
import type { PageRefetchCallback } from './Page';
import RichText from 'components/common/RichText';
import { PageHero } from 'components/common/PageHero';

const BodyCard = styled.div`
  padding: 2rem;
  border-radius: ${(props) => props.theme.cardBorderRadius};
  background-color: ${(props) => props.theme.themeColors.white};
  box-shadow: 3px 3px 12px rgba(33, 33, 33, 0.15);
`;

type StaticPageProps = {
  page: NonNullable<GetPageQuery['page']> & {
    __typename: 'StaticPage';
  };
  refetch: PageRefetchCallback;
};

function StaticPage({ page }: StaticPageProps) {
  return (
    <PageHero title={page.title} overlap>
      <BodyCard>
        {(page?.body ?? []).map((block) => {
          if (block?.__typename == 'RichTextBlock') {
            return <RichText key={block.id} html={block.value} />;
          }
          return null;
        })}
      </BodyCard>
    </PageHero>
  );
}

export default StaticPage;
