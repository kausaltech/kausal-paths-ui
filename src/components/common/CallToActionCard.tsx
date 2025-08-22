import { Card, CardContent, Link as MuiLink, Typography } from '@mui/material';
import { ArrowRight } from 'react-bootstrap-icons';

import { Link } from '@/common/links';

type CallToActionCardProps = {
  title: string;
  content?: string | null;
  linkUrl: string;
};

export default function CallToActionCard({ title, content, linkUrl }: CallToActionCardProps) {
  return (
    <MuiLink component={Link} href={linkUrl}>
      <Card
        sx={{
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          transition: 'background-color 0.1s ease',
          cursor: 'pointer',
          '.cta-arrow': {
            transition: 'transform 0.1s ease',
          },
          '&:hover': {
            backgroundColor: 'primary.dark',

            '.cta-arrow': {
              transform: 'translateX(4px)',
            },
          },
        }}
      >
        <CardContent>
          <Typography
            variant="h3"
            gutterBottom={!!content}
            sx={{
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {title}
            {!content && <ArrowRight className="cta-arrow" size={24} />}
          </Typography>
          {content && (
            <Typography>
              {content} <ArrowRight className="cta-arrow" size={16} />
            </Typography>
          )}
        </CardContent>
      </Card>
    </MuiLink>
  );
}
