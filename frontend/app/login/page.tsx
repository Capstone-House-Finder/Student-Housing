import { Suspense } from 'react';
import AuthSlidingPanel from '@/components/AuthSlidingPanel';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <AuthSlidingPanel initialMode="signin" />
    </Suspense>
  );
}
