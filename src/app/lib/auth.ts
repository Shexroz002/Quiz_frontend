const PUBLIC_PATHS = new Set(['/login', '/register']);

let authFetchInstalled = false;

export const getAccessToken = () => {
  return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
};

export const clearAuthStorage = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_type');
  localStorage.removeItem('user');

  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('token_type');
  sessionStorage.removeItem('user');
};

export const isPublicPath = (pathname: string) => {
  return PUBLIC_PATHS.has(pathname);
};

export const redirectToLogin = () => {
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;

  if (isPublicPath(currentPath)) {
    return;
  }

  clearAuthStorage();

  const next = `${currentPath}${currentSearch}`;
  const target = next && next !== '/' ? `/login?next=${encodeURIComponent(next)}` : '/login';

  window.location.replace(target);
};

export const installAuthFetchInterceptor = () => {
  if (authFetchInstalled || typeof window === 'undefined') {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);

    if (response.status === 401 && !isPublicPath(window.location.pathname)) {
      redirectToLogin();
    }

    return response;
  };

  authFetchInstalled = true;
};
