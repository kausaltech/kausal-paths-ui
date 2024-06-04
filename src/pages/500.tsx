import Error from './_error';

export default function InternalServerError(props) {
  return <Error statusCode={500} />;
}
