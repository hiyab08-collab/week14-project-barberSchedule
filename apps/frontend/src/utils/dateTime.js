const shopTimeZone = import.meta.env.VITE_SHOP_TIME_ZONE || undefined;

export function formatDateTime(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(shopTimeZone ? { timeZone: shopTimeZone } : {}),
  }).format(new Date(value));
}

export function minimumBookingDateTime() {
  const date = new Date(Date.now() + 60000);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
