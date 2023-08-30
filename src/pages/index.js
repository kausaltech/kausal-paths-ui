import Page from 'components/pages/Page';
import FrontPageHeader from 'components/general/FrontPageHeader';
import { useInstance } from 'common/instance';

export default function Home() {
  const instance = useInstance();
  const header = (instance.leadTitle || instance.leadParagraph) && (
    <FrontPageHeader
      leadTitle={instance.leadTitle}
      leadParagraph={instance.leadParagraph}
    />
  );
  return <Page path="/" headerExtra={header} />;
}
