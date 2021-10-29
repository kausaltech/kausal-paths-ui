import Page from 'components/pages/Page';
import FrontPageHeader from 'components/general/FrontPageHeader';
import { useSite } from 'context/site';


export default function Home() {
  const site = useSite();
  const { instance } = site;
  const header = (instance.leadTitle || instance.leadParagraph) && (
    <FrontPageHeader
      leadTitle={instance.leadTitle}
      leadParagraph={instance.leadParagraph}
    />
  );
  return <Page path='/' headerExtra={header} />
}
