import Image from 'next/image';
import { AppBar, Button, Container, Toolbar, Typography } from '@mui/material';

export default function Home() {
  return (
    <main>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            NetZeroPaths
            <Typography variant="caption" sx={{ display: 'block' }}>
              Powered by Kausal Open Source
            </Typography>
          </Typography>
        </Toolbar>
      </AppBar>
    </main>
  );
}
