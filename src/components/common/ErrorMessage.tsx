import { Typography } from '@mui/material';

import ContentContainer from '@common/components/ContentContainer';

export default function ErrorMessage({ message }: { message: string }) {
  return (
    <ContentContainer>
      <Typography variant="h2" className="p-5">
        {message}
      </Typography>
    </ContentContainer>
  );
}
