import Head from 'next/head';
import { gql, useQuery, useMutation } from "@apollo/client";
import { Spinner } from 'reactstrap';
// import { useTranslation } from '../i18n';
import Layout from 'components/Layout';


// const START_SIMULATION = gql`
//   mutation {
//     runSimulation {
//       runId
//     }
//   }
// `;


export default function Home() {
  // const { t, i18n } = useTranslation(['common']);
  // 
  // const [
  //   runSimulation,
  //   { loading, error, data, called }
  //   { loading, error, data, called }
  // ] = useMutation(START_SIMULATION);
  // 
  // if (process.browser && !called) {
  //   runSimulation();
  // }
  // 
  // if (error) {
  //   console.log(error);
  //   return <div>Error</div>
  // }
  // 
  // if (loading || !data) {
  //   return <div className="d-flex justify-content-center align-items-center vw-100 vh-100"><div><Spinner style={{ width: '3rem', height: '3rem' }} /></div></div>
  // }

  return (
    <Layout>
      <Head>
        <title>Kausal Paths</title>
      </Head>
      <p>TODO</p>
    </Layout>
  )
}

Home.getInitialProps = async () => ({
  namespacesRequired: ['common'],
})
