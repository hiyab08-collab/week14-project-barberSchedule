export function canManageAppointmentPayment(user, appointment) {
  if (!user || !appointment) return false;

  return (
    user.role === "ADMIN" ||
    appointment.customerId === user.userId ||
    (user.role === "BARBER" && appointment.barberId === user.userId)
  );
}

export function validateManualPayment(paymentMethod, paymentNote) {
  if (!['CASH', 'CARD', 'OTHER'].includes(paymentMethod)) {
    return { error: 'Payment method must be CASH, CARD, or OTHER' };
  }

  if (paymentMethod === 'CARD') {
    return { error: 'Card payments must be completed through Stripe Checkout' };
  }

  const note = typeof paymentNote === 'string' ? paymentNote.trim() : '';

  if (paymentMethod === 'OTHER' && !note) {
    return { error: 'A payment note is required for OTHER payments' };
  }

  if (note.length > 100) {
    return { error: 'Payment notes cannot exceed 100 characters' };
  }

  return { note: paymentMethod === 'OTHER' ? note : null };
}

export function buildCardPaymentData(appointment, paymentIntentId, now = new Date(), card = {}) {
  return {
    paid: true,
    paymentMethod: "CARD",
    paymentNote: null,
    paidAt: appointment.paidAt || now,
    stripePaymentIntentId: paymentIntentId,
    cardBrand: card.brand || null,
    cardLast4: card.last4 || null,
    refunded: false,
    refundedAt: null,
  };
}

export function shouldRefundAppointment(appointment) {
  return Boolean(
    appointment.paid &&
      appointment.stripePaymentIntentId &&
      !appointment.refunded,
  );
}
