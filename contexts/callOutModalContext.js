import React, { createContext, useContext, useState, useCallback } from 'react';

const CalloutModalContext = createContext();

export function CalloutModalProvider({ children }) {
  const [isCalloutOpen, setIsCalloutOpen] = useState(false);

  const openCallout = useCallback(() => setIsCalloutOpen(true), []);
  const closeCallout = useCallback(() => setIsCalloutOpen(false), []);

  return (
    <CalloutModalContext.Provider value={{ isCalloutOpen, openCallout, closeCallout }}>
      {children}
    </CalloutModalContext.Provider>
  );
}

export function useCalloutModal() {
  const ctx = useContext(CalloutModalContext);
  if (!ctx) throw new Error('useCalloutModal must be used within a CalloutModalProvider');
  return ctx;
}
