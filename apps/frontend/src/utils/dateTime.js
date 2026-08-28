const shopTimeZone = import.meta.env.VITE_SHOP_TIME_ZONE || undefined;

export function formatDateTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(shopTimeZone ? { timeZone: shopTimeZone } : {}),
  }).format(new Date(value));
}
