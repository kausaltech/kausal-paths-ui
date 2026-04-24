import React from 'react';

const FullScreenLayout = ({ children }: React.PropsWithChildren) => {
  return (
    <main className="main" id="main">
      {children}
    </main>
  );
};

export default FullScreenLayout;
