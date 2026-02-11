import { gql } from '@apollo/client';

export const UNIT_FRAGMENT = gql`
  fragment UnitFields on UnitType {
    short
    htmlShort
    htmlLong
  }
`;
