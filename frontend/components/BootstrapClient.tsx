'use client';

import { useEffect } from 'react';

export default function BootstrapClient() {
  useEffect(() => {
    // @ts-expect-error - Bootstrap type definitions might be missing or incomplete
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return null;
}
