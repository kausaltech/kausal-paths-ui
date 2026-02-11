import Error from './_error';

export default function InternalServerError() {
  return <Error statusCode={500} />;
}
