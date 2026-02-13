import Error from './_error';

export default function NotFoundError() {
  return <Error statusCode={404} />;
}
