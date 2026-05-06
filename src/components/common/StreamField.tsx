import { gql } from '@apollo/client';

import type { StreamFieldFragment } from '@/common/__generated__/graphql';
import { FrameworkLanding } from '@/components/general/FrameworkLanding';
import { CardListBlock } from './CardListBlock';
import RichText from './RichText';

export const STREAM_FIELD_FRAGMENT = gql`
  fragment StreamField on StreamFieldInterface {
    id
    blockType
    field
    ... on RichTextBlock {
      value
      rawValue
    }

    ... on TextBlock {
      value
    }

    ... on CardListBlock {
      blockType
      title
      cards {
        __typename
        title
        shortDescription
      }
    }

    ... on FrameworkLandingBlock {
      heading
      body
      ctaLabel
      ctaUrl
      framework {
        id
        identifier
        name
        description
        allowUserRegistration
        allowInstanceCreation
      }
    }
  }
`;

type Props = {
  block: StreamFieldFragment;
};

export function StreamField({ block }: Props) {
  switch (block.__typename) {
    case 'RichTextBlock':
      return <RichText html={block.value} />;

    case 'TextBlock':
      return null;

    case 'CardListBlock':
      return (
        <CardListBlock
          cards={block.cards?.filter((card) => !!card?.title) ?? []}
          title={block.title ?? undefined}
        />
      );

    case 'FrameworkLandingBlock':
      return <FrameworkLanding block={block} />;

    default:
      return null;
  }
}
