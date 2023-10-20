'use client';

import Link from 'next/link';

import { styled } from 'styled-components';
const Red = styled.div`
  color: blue;
  background-color: yellow;
`;

export default function Page(props) {
  console.log('page render');
  return (
    <div>
      <h1>Hello, Here!</h1>
      <Red>
        <Link href="/testi" as="/testi" locale={'en'}>
          moimoi
        </Link>
      </Red>
    </div>
  );
}
