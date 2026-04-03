// ─── EMAIL SERVICE ────────────────────────────────────────────────────────────
const nodemailer = require('nodemailer');
const logger     = require('./logger');

// ── Transporter ───────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup
transporter.verify((error) => {
  if (error) logger.warn('📧 Email transporter not ready:', error.message);
  else       logger.info('📧 Email transporter ready');
});

// ── Shared HTML wrapper ────────────────────────────────────────────────────────
function wrapEmail(bodyHtml) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin:0; padding:0; background:#0a0a08; font-family: Georgia, serif; }
      .wrap { max-width:600px; margin:0 auto; padding:32px 16px; }
      .header { text-align:center; border-bottom:1px solid #D4AF3740; padding-bottom:24px; margin-bottom:32px; }
      .logo { font-size:2rem; }
      .brand { color:#D4AF37; font-size:1.1rem; letter-spacing:0.1em; text-transform:uppercase; margin-top:8px; }
      .sub   { color:#a89060; font-size:0.7rem; letter-spacing:0.2em; text-transform:uppercase; }
      h2  { color:#f5efe0; font-size:1.5rem; font-weight:400; margin:0 0 16px; }
      p   { color:#c8b89a; font-size:0.95rem; line-height:1.8; margin:0 0 12px; }
      .box { background:#111109; border:1px solid #D4AF3720; border-radius:12px; padding:24px; margin:24px 0; }
      .row { display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #ffffff10; }
      .row:last-child { border-bottom:none; }
      .row-label { color:#a89060; font-size:0.8rem; letter-spacing:0.1em; text-transform:uppercase; }
      .row-value { color:#f5efe0; font-size:0.95rem; }
      .badge { display:inline-block; background:#D4AF3720; color:#D4AF37; border:1px solid #D4AF3740;
               padding:4px 14px; border-radius:20px; font-size:0.8rem; letter-spacing:0.1em; text-transform:uppercase; }
      .footer { text-align:center; border-top:1px solid #D4AF3720; padding-top:24px; margin-top:32px; color:#3a3428; font-size:0.75rem; }
      a { color:#D4AF37; text-decoration:none; }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="header">
        <div class="logo">🐯</div>
        <div class="brand">Wildlife Safari India</div>
        <div class="sub">Ranthambore National Park</div>
      </div>
      ${bodyHtml}
      <div class="footer">
        © 2025 Wildlife Safari India · +91 8368868187 · New Delhi 110017
        <br/>This is an automated email — please do not reply directly.
      </div>
    </div>
  </body>
  </html>`;
}

// ── Email senders ─────────────────────────────────────────────────────────────

// 1. Booking confirmation → customer
async function sendBookingConfirmation(booking) {
  const html = wrapEmail(`
<h2>
  ${
    booking.status === 'CONFIRMED'
      ? 'Your Safari is Confirmed! ✅'
      : booking.status === 'CANCELLED'
      ? 'Your Safari Booking is Cancelled ❌'
      : 'Your Safari is Booked! 🎉'
  }
</h2>
    <p>Dear <strong style="color:#f5efe0">${booking.name}</strong>,</p>
    <p>Thank you for booking with Wildlife Safari India. We've received your request and will confirm within 24 hours.</p>
    <div class="box">
      <div class="row"><span class="row-label">Booking ID</span><span class="row-value">${booking.id}</span></div>
      <div class="row"><span class="row-label">Safari Date</span><span class="row-value">${new Date(booking.safariDate).toDateString()}</span></div>
      <div class="row"><span class="row-label">Safari Type</span><span class="row-value">${booking.safariType}</span></div>
      <div class="row"><span class="row-label">Zone</span><span class="row-value">${booking.safariZone}</span></div>
      <div class="row"><span class="row-label">Time</span><span class="row-value">${booking.safariTime}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value"><span class="badge" style="
  ${booking.status === 'CONFIRMED' ? 'color:#4CAF50;border-color:#4CAF5040;' : ''}
  ${booking.status === 'CANCELLED' ? 'color:#E53935;border-color:#E5393540;' : ''}
">
  ${booking.status === 'PENDING' ? 'Pending Confirmation' : booking.status}
</span></span></div>
    </div>
    <p>Our team will reach out to you at <strong style="color:#D4AF37">${booking.email}</strong>${booking.phone ? ` or <strong style="color:#D4AF37">${booking.phone}</strong>` : ''} shortly.</p>
    <p>Need help? Call us: <a href="tel:+918368868187">+91 8368868187</a></p>
  `);

  return transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      booking.email,
    subject: `Booking Received — ${new Date(booking.safariDate).toDateString()} · Wildlife Safari India`,
    html,
  });
}

// 2. Booking alert → admin
async function sendBookingAlert(booking) {
  const html = wrapEmail(`
    <h2>New Booking Request 🐯</h2>
    <div class="box">
      <div class="row"><span class="row-label">ID</span><span class="row-value">${booking.id}</span></div>
      <div class="row"><span class="row-label">Name</span><span class="row-value">${booking.name}</span></div>
      <div class="row"><span class="row-label">Email</span><span class="row-value"><a href="mailto:${booking.email}">${booking.email}</a></span></div>
      <div class="row"><span class="row-label">Phone</span><span class="row-value">${booking.phone || '—'}</span></div>
      <div class="row"><span class="row-label">Date</span><span class="row-value">${new Date(booking.safariDate).toDateString()}</span></div>
      <div class="row"><span class="row-label">Type</span><span class="row-value">${booking.safariType}</span></div>
      <div class="row"><span class="row-label">Zone</span><span class="row-value">${booking.safariZone}</span></div>
      <div class="row"><span class="row-label">Time</span><span class="row-value">${booking.safariTime}</span></div>
    </div>
  `);

  return transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      process.env.ADMIN_EMAIL,
    subject: `[NEW BOOKING] ${booking.name} — ${new Date(booking.safariDate).toDateString()}`,
    html,
  });
}

// 3. Contact confirmation → customer
async function sendContactConfirmation(contact) {
  const html = wrapEmail(`
    <h2>We've Received Your Message</h2>
    <p>Dear <strong style="color:#f5efe0">${contact.name}</strong>,</p>
    <p>Thank you for reaching out to Wildlife Safari India. We typically respond within 24 hours.</p>
    <div class="box">
      <p style="color:#a89060; font-style:italic;">"${contact.message}"</p>
    </div>
    <p>Need urgent help? Call us: <a href="tel:+918368868187">+91 8368868187</a></p>
  `);

  return transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      contact.email,
    subject: 'We received your message · Wildlife Safari India',
    html,
  });
}

// 4. Contact alert → admin
async function sendContactAlert(contact) {
  const html = wrapEmail(`
    <h2>New Contact Message 📬</h2>
    <div class="box">
      <div class="row"><span class="row-label">Name</span><span class="row-value">${contact.name}</span></div>
      <div class="row"><span class="row-label">Email</span><span class="row-value"><a href="mailto:${contact.email}">${contact.email}</a></span></div>
      <div class="row"><span class="row-label">Message</span><span class="row-value">${contact.message}</span></div>
    </div>
  `);

  return transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      process.env.ADMIN_EMAIL,
    subject: `[CONTACT] ${contact.name} — Wildlife Safari India`,
    html,
  });
}

// 5. Newsletter welcome
async function sendNewsletterWelcome(email) {
  const html = wrapEmail(`
    <h2>Welcome to the Wild! 🌿</h2>
    <p>You're now subscribed to <strong style="color:#D4AF37">The Wildlife Journal</strong>.</p>
    <p>Expect field notes, conservation stories, seasonal guides, and rare sighting reports — delivered straight to your inbox.</p>
  `);

  return transporter.sendMail({
    from:    process.env.EMAIL_FROM,
    to:      email,
    subject: 'Welcome to The Wildlife Journal 🐯',
    html,
  });
}

// 6. Booking status update → customer
async function sendBookingStatusUpdate(booking) {
  // status badge color logic
  let badgeText = booking.status;
  let badgeColor = "#D4AF37";

  if (booking.status === "CONFIRMED") badgeColor = "#4CAF50";
  if (booking.status === "CANCELLED") badgeColor = "#E53935";

  const html = wrapEmail(`
    <h2>Booking Status Updated</h2>

    <p>Dear <strong style="color:#f5efe0">${booking.name}</strong>,</p>

    <p>Your safari booking status has been updated. Please find the details below:</p>

    <div class="box">
      <div class="row">
        <span class="row-label">Booking ID</span>
        <span class="row-value">${booking.id}</span>
      </div>

      <div class="row">
        <span class="row-label">Safari Date</span>
        <span class="row-value">${new Date(booking.safariDate).toDateString()}</span>
      </div>

      <div class="row">
        <span class="row-label">Safari Type</span>
        <span class="row-value">${booking.safariType}</span>
      </div>

      <div class="row">
        <span class="row-label">Zone</span>
        <span class="row-value">${booking.safariZone}</span>
      </div>

      <div class="row">
        <span class="row-label">Time</span>
        <span class="row-value">${booking.safariTime}</span>
      </div>

      <div class="row">
        <span class="row-label">Status</span>
        <span class="row-value">
          <span class="badge" style="color:${badgeColor}; border-color:${badgeColor}40;">
            ${badgeText}
          </span>
        </span>
      </div>
    </div>

    ${
      booking.status === "CONFIRMED"
        ? `<p style="color:#4CAF50;">✅ Your booking is confirmed. Please be ready on time.</p>`
        : ""
    }

    ${
      booking.status === "CANCELLED"
        ? `<p style="color:#E53935;">❌ Your booking has been cancelled. Contact support for help.</p>`
        : ""
    }

    <p>Need help? Call us: <a href="tel:+918368868187">+91 8368868187</a></p>
  `);

  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: booking.email,
    subject: `Booking ${booking.status} — ${new Date(booking.safariDate).toDateString()}`,
    html,
  });
}
module.exports = {
  sendBookingConfirmation,
  sendBookingAlert,
  sendContactConfirmation,
  sendContactAlert,
  sendNewsletterWelcome,
   sendBookingStatusUpdate,
};
