"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import EnrollmentModal from '@/components/EnrollmentModal';

interface EnrollmentModalContextType {
  openModal: () => void;
}

const EnrollmentModalContext = createContext<EnrollmentModalContextType | undefined>(undefined);

export function useEnrollmentModal() {
  const context = useContext(EnrollmentModalContext);
  if (!context) {
    throw new Error('useEnrollmentModal must be used within an EnrollmentModalProvider');
  }
  return context;
}

export function EnrollmentModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <EnrollmentModalContext.Provider value={{ openModal }}>
      {children}
      <EnrollmentModal isOpen={isOpen} onClose={closeModal} />
    </EnrollmentModalContext.Provider>
  );
}