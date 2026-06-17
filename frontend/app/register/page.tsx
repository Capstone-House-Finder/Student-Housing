import { Suspense } from 'react';
import AuthSlidingPanel from '@/components/AuthSlidingPanel';

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <AuthSlidingPanel initialMode="signup" />
    </Suspense>
  );
}
