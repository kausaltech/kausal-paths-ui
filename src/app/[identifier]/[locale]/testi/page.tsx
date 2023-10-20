import Link from 'next/link';

export default function Page(props) {
  return (
    <div>
      <h1>Testisivu!</h1>
      <div>
        <Link href="/" locale={'en'}>
          juurilinkki
        </Link>
      </div>
    </div>
  );
}
