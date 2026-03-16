/**
 * Shim for next/error.
 * Provides a minimal error component matching the Next.js ErrorProps interface.
 */
export interface ErrorProps {
  statusCode: number;
  title?: string;
  withDarkMode?: boolean;
}

function NextError({ statusCode, title }: ErrorProps) {
  return (
    <div style={{ padding: 32, textAlign: 'center' }}>
      <h1>{statusCode}</h1>
      <p>{title || (statusCode === 404 ? 'Page not found' : 'An error occurred')}</p>
    </div>
  );
}

NextError.getInitialProps = () => ({ statusCode: 500 });

export default NextError;
