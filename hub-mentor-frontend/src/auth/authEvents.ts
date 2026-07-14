// Bridge between the non-React axios layer and the React AuthProvider.
// The axios response interceptor can't call hooks, so on a hard 401 it emits
// here and the AuthProvider (subscribed) performs the logout.

type Handler = () => void;

const handlers = new Set<Handler>();

export const onForceLogout = (h: Handler): (() => void) => {
  handlers.add(h);
  return () => {
    handlers.delete(h);
  };
};

export const emitForceLogout = (): void => {
  handlers.forEach((h) => h());
};
