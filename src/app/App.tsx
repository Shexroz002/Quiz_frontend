import { useEffect } from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { Toaster } from 'sonner';
import { installAuthFetchInterceptor } from './lib/auth';

export default function App() {
  useEffect(() => {
    installAuthFetchInterceptor();
  }, []);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster 
        position="top-center"
        expand={true}
        richColors
        closeButton
      />
    </>
  );
}
