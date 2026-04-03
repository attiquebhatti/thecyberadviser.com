'use client';

import React from 'react';

interface DownloadButtonProps {
  className?: string;
  id?: string;
  children: React.ReactNode;
}

export default function DownloadButton({ className, id, children }: DownloadButtonProps) {
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        alert('You are running in Development Mode.\n\nTo generate the Windows .exe installer, open your terminal and run:\nnpm run desktop:build');
      }}
      className={className}
      id={id}
    >
      {children}
    </a>
  );
}
