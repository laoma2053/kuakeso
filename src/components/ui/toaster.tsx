'use client';

import { Toaster as SonnerToaster } from 'sonner';

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        style: {
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
        },
      }}
    />
  );
}
