import React from 'react';

interface PurchasesLayoutProps {
  children: React.ReactNode;
}

const PurchasesLayout: React.FC<PurchasesLayoutProps> = ({ children }) => {
  return (
    <section>
      {children}
    </section>
  );
};

export default PurchasesLayout;
