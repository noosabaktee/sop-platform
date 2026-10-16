import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'iconify-icon';

import './styles/index.css';

import { AuthProvider } from './app/AuthContext';
import { App } from './app/App';
import { installGlobalExcelInterceptor } from './utils/excelExport';

// Ensure any and all CSV exports across the application are transformed into Excel (.xlsx)
installGlobalExcelInterceptor();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found in document');
}

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </QueryClientProvider>
);
