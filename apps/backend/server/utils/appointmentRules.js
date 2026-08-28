export function appointmentsOverlap(
  requestedStart,
  requestedDurationMinutes,
  existingStart,
  existingDurationMinutes,
) {
  const requestedStartDate = new Date(requestedStart);
  const existingStartDate = new Date(existingStart);
  const requestedEnd = new Date(
    requestedStartDate.getTime() + requestedDurationMinutes * 60000,
  );
  const existingEnd = new Date(
    existingStartDate.getTime() + existingDurationMinutes * 60000,
  );

  return requestedStartDate < existingEnd && existingStartDate < requestedEnd;
}

export function isFutureAppointmentTime(value, now = new Date()) {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > now.getTime();
}
