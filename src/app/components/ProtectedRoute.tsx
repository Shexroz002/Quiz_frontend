import { Navigate, Outlet, useLocation } from 'react-router';
import { getAccessToken } from '../lib/auth';

export function ProtectedRoute() {
  const location = useLocation();
  const accessToken = getAccessToken();

  if (!accessToken) {
    const next = `${location.pathname}${location.search}`;
    const loginPath = next && next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login';

    return <Navigate to={loginPath} replace />;
  }

  return <Outlet />;
}
