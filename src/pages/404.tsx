import Error from './_error';

export default function NotFoundError(props) {
  return <Error statusCode={404} />;
}
