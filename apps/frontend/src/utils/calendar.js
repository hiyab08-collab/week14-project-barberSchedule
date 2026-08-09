function formatCalendarDate(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function buildGoogleCalendarUrl({
  title,
  description,
  startTime,
  durationMinutes,
}) {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatCalendarDate(start)}/${formatCalendarDate(end)}`,
    details: description || "",
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function downloadIcsFile({
  title,
  description,
  startTime,
  durationMinutes,
}) {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `DTSTART:${formatCalendarDate(start)}`,
    `DTEND:${formatCalendarDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description || ""}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "appointment.ics";
  link.click();

  URL.revokeObjectURL(url);
}
