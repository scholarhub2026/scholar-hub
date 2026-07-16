import { useLocation } from "react-router-dom";

/**
 * Base path for mentor-browsing links so a logged-in student stays inside the
 * dashboard shell instead of bouncing to the public marketing pages.
 *
 * Returns "/app" when rendered under the student portal (`/app/…`), else "" for
 * the public site. Use it to build hrefs (`${base}/mentors/:id`) and to pick the
 * page layout (see PortalPage).
 */
export const usePortalBase = (): "" | "/app" => {
  const { pathname } = useLocation();
  return pathname === "/app" || pathname.startsWith("/app/") ? "/app" : "";
};
