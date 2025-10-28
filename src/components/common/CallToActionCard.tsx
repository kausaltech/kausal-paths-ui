import { Card, CardContent, Link as MuiLink, Typography } from '@mui/material';
import { ArrowRight } from 'react-bootstrap-icons';

import { Link } from '@/common/links';

type CallToActionCardProps = {
  title: string;
  content?: string | null;
  linkUrl: string;
};

const CtaArrow = ({ size }: { size: number }) => (
  <ArrowRight
    className="cta-arrow"
    size={size}
    aria-hidden="true"
    focusable="false"
    role="presentation"
  />
);

export default function CallToActionCard({ title, content, linkUrl }: CallToActionCardProps) {
  const ariaLabel = content ? `${title}. ${content}` : title;

  return (
    <MuiLink 
      component={Link} 
      href={linkUrl}
      underline="none"
      sx={{ display: 'block' }}
      aria-label={ariaLabel}
      role="link"
    >
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
            {!content && <CtaArrow size={24} />}
          </Typography>
          {content && (
            <Typography>
              {content} <CtaArrow size={16} />
            </Typography>
          )}
        </CardContent>
      </Card>
    </MuiLink>
  );
}
