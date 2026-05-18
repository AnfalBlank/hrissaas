/**
 * Resolve a notification to the route it should navigate to.
 * Priority:
 *   1. notification.link (explicit deep link, e.g. "/app/chat?conv=xyz")
 *   2. category fallback
 *   3. default → /app/notifications
 */
export function resolveNotifLink(
  n: { link?: string | null; category?: string | null },
  isAdminContext = false
): string {
  if (n.link) return n.link;

  const c = n.category ?? "system";
  if (isAdminContext) {
    switch (c) {
      case "attendance":
        return "/admin/attendance";
      case "leave":
        return "/admin/leave";
      case "payroll":
        return "/admin/payroll";
      case "cms":
        return "/admin/cms";
      case "chat":
        return "/app/chat";
      default:
        return "/admin";
    }
  }

  switch (c) {
    case "attendance":
      return "/app/history";
    case "leave":
      return "/app/leave";
    case "payroll":
      return "/app/payroll";
    case "cms":
      return "/app/news";
    case "chat":
      return "/app/chat";
    default:
      return "/app/notifications";
  }
}
