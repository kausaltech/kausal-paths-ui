import { Container, Typography } from '@mui/material';

export default function ErrorMessage({ message }) {
  return (
    <Container fixed maxWidth="xl">
      <Typography variant="h2" className="p-5">
        {message}
      </Typography>
    </Container>
  );
}
