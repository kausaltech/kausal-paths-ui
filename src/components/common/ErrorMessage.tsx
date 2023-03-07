import { Container } from 'reactstrap';


export default function ErrorMessage({ message }) {
  return (
    <Container>
      <h2 className="p-5">{message}</h2>
    </Container>
  );
}
