import { createContext, useContext, useState } from 'react';

interface LegalDialogContextType {
  privacyOpen: boolean;
  termsOpen: boolean;
  setPrivacyOpen: (open: boolean) => void;
  setTermsOpen: (open: boolean) => void;
}

const LegalDialogContext = createContext<LegalDialogContextType | undefined>(undefined);

export function LegalDialogProvider({ children }: { children: React.ReactNode }) {
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  return (
    <LegalDialogContext.Provider value={{ privacyOpen, termsOpen, setPrivacyOpen, setTermsOpen }}>
      {children}
    </LegalDialogContext.Provider>
  );
}

export function useLegalDialog() {
  const context = useContext(LegalDialogContext);
  if (!context) {
    throw new Error('useLegalDialog must be used within LegalDialogProvider');
  }
  return context;
}
