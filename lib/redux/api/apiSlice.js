import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { BASE_URL } from '@/utils/baseUrl';

export const apiSlice = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: BASE_URL,
        prepareHeaders: (headers) => {
            // If you have auth tokens, you can add them here
            return headers;
        },
        credentials: 'include', // Important for cookies/session
    }),
    keepUnusedDataFor: 180, // Keep cached in memory for 3 minutes during active navigation
    refetchOnFocus: false, // Prevent spamming API queries every time the admin tab is focused
    refetchOnReconnect: true,
    tagTypes: ['Product', 'Combo', 'Order', 'DashboardStats'],
    endpoints: (builder) => ({}),
});
