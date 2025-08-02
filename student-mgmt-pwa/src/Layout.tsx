import React from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        minWidth: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)',
        boxSizing: 'border-box',
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: 600,
          padding: 24,
          boxSizing: 'border-box',
        }}
      >
        {children}
      </main>
    </div>
  );
}