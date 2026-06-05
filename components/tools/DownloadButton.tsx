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
      href="/downloads/UnifiedMigrator-Setup.exe"
      download="UnifiedMigrator-Setup.exe"
      className={className}
      id={id}
    >
      {children}
    </a>
  );
}
