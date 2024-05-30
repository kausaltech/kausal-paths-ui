import { gql } from '@apollo/client';
import RichText from './RichText';
import { StreamFieldFragmentFragment } from 'common/__generated__/graphql';
import { CardListBlock } from './CardListBlock';

export const STREAM_FIELD_FRAGMENT = gql`
  fragment StreamFieldFragment on StreamFieldInterface {
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
  }
`;

type Props = {
  block: StreamFieldFragmentFragment;
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

    default:
      return null;
  }
}
