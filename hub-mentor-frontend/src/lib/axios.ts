import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { emitForceLogout } from '@/auth/authEvents';

// Production ALWAYS calls the same-origin '/api' path, which vercel.json
// proxies server-side to the Railway backend. Phones on many carrier networks
// cannot reach the raw *.up.railway.app domain directly (IPv4-only), and
// same-origin also keeps the refresh cookie first-party on mobile Safari.
// The env var only applies to local dev (defaults to the local backend).
const BASE_URL = import.meta.env.DEV
  ? import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  : '/api';
const TOKEN_KEY = 'token';
const REFRESH_PATH = '/auth/refresh';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  // Required so the browser stores/sends the httpOnly refresh cookie cross-site.
  // Backend CORS uses credentials:true with an explicit origin allow-list.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach the current access token.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Silent refresh
//
// On a 401 we try ONCE to exchange the refresh cookie for a new access token
// (POST /auth/refresh), then replay the failed request. Concurrent 401s are
// queued behind a single in-flight refresh so we don't fire N refreshes. If the
// refresh fails, we force a logout (see authEvents → AuthProvider).
// ---------------------------------------------------------------------------
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const flushQueue = (error: unknown, token: string | null) => {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
};

// Bare axios (no interceptors) so refreshing can't recurse. The httpOnly cookie
// is the credential — no Authorization header needed.
const performRefresh = async (): Promise<string> => {
  const res = await axios.post(
    `${BASE_URL}${REFRESH_PATH}`,
    {},
    { withCredentials: true },
  );
  const newToken: string | undefined = res.data?.token;
  if (!newToken) throw new Error('No token in refresh response');
  localStorage.setItem(TOKEN_KEY, newToken);
  return newToken;
};

const retryWithToken = (
  config: InternalAxiosRequestConfig & { _retry?: boolean },
  token: string,
) => {
  config._retry = true;
  config.headers.Authorization = `Bearer ${token}`;
  return axiosInstance(config);
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    const canRefresh =
      status === 401 &&
      !!original &&
      !original._retry &&
      !original.url?.includes(REFRESH_PATH);

    if (!canRefresh) {
      if (status === 401) emitForceLogout();
      return Promise.reject(error);
    }

    // A refresh is already in flight — queue this request behind it.
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => retryWithToken(original!, token));
    }

    isRefreshing = true;
    try {
      const newToken = await performRefresh();
      flushQueue(null, newToken);
      return retryWithToken(original!, newToken);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      emitForceLogout();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosInstance;
