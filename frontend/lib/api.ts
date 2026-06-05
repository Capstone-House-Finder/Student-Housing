import { configureApi } from '@housing/shared';

configureApi(process.env.NEXT_PUBLIC_API_URL);

export * from '@housing/shared';
