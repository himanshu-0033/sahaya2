// Where a reset link goes.
//
// This app has no mail provider configured, and inventing a dependency on one
// would have made the whole reset flow undeployable until somebody signed up
// for an account somewhere. So delivery is a seam, the same shape as the one
// agent/lib/provider.js uses for models: one function, chosen by an
// environment variable, with a default that works on a laptop.
//
//   resend   — posts to Resend's HTTP API. Needs RESEND_API_KEY and
//              RESET_FROM_EMAIL. Plain fetch, no SDK, no new dependency.
//   log      — writes the link to the server log. The default, and the right
//              default: it is obviously not production, it needs nothing, and
//              it lets the whole flow be built and tested end to end.
//
// Adding a provider means adding a function here and a name to DELIVERERS.
// Nothing above this file changes.
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

function resetUrl(token) {
  return `${APP_URL.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
}

function body(name, token) {
  return [
    `Hello${name ? ` ${name}` : ''},`,
    '',
    'Someone asked to reset the password on your DP Sahay account. If that was you,',
    'open this link within 30 minutes:',
    '',
    resetUrl(token),
    '',
    'If it was not you, you can ignore this. Your password has not changed, and the',
    'link stops working once it is used or once a newer one is asked for.',
  ].join('\n');
}

async function logDeliverer({ email, name, token }) {
  // Deliberately the whole link. This deliverer exists so a developer can
  // complete the flow, and half a link would not let them.
  console.log(
    `\n[reset] no mail provider configured, so the link is here instead.\n` +
      `[reset] to: ${email}\n${body(name, token)}\n`,
  );
}

async function resendDeliverer({ email, name, token }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESET_FROM_EMAIL;
  if (!key) throw new Error('RESEND_API_KEY is not set');
  if (!from) throw new Error('RESET_FROM_EMAIL is not set');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Reset your DP Sahay password',
      text: body(name, token),
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend returned ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
}

const DELIVERERS = {
  log: logDeliverer,
  resend: resendDeliverer,
};

export const activeDeliverer = process.env.RESET_DELIVERY || 'log';

export async function deliverResetLink({ email, name, token }) {
  const deliver = DELIVERERS[activeDeliverer];
  if (!deliver) {
    throw new Error(
      `RESET_DELIVERY "${activeDeliverer}" is not implemented. Add it to DELIVERERS in lib/reset-delivery.js.`,
    );
  }
  return deliver({ email, name, token });
}

export { resetUrl };
