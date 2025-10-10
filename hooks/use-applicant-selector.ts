'use client';

import { useState, useEffect } from 'react';

export function useApplicantSelector() {
  const [selectedApplicantIndex, setSelectedApplicantIndex] = useState(0);

  useEffect(() => {
    const handleApplicantChange = (event: CustomEvent) => {
      setSelectedApplicantIndex(event.detail.index);
    };

    window.addEventListener('applicantChange', handleApplicantChange as EventListener);
    
    return () => {
      window.removeEventListener('applicantChange', handleApplicantChange as EventListener);
    };
  }, []);

  return selectedApplicantIndex;
}