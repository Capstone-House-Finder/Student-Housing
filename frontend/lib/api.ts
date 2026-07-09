import { configureApi } from '@capstone-house-finder/shf-api';

configureApi(process.env.NEXT_PUBLIC_API_URL);

export * from '@capstone-house-finder/shf-api';
