'use client';

import { useState } from 'react';

export function CompanyLogo({ src, fallback, size }: { src: string; fallback: string; size: number }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <span className="flex size-full items-center justify-center font-display tracking-wide text-blue">{fallback}</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className="size-full object-contain p-1.5"
      onError={() => setFailed(true)}
    />
  );
}
