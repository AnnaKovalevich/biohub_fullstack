import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';
import { trpc, trpcClient } from './lib/trpc';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      onError: (error) => {
        if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      },
    },
    mutations: {
      onError: (error) => {
        if (error instanceof TRPCClientError && error.data?.code === 'UNAUTHORIZED') {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </trpc.Provider>
  </React.StrictMode>,
);
