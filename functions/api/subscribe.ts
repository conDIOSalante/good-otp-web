interface SubscribePayload {
  email?: string;
  first_name?: string;
  website?: string;
  form_id?: string;
  form_location?: string;
  offer_id?: string;
}

interface Env {
  KIT_API_SECRET?: string;
  KIT_FORM_ID?: string;
  KIT_TAG_IDS?: string;
  ALLOWED_ORIGIN?: string;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function parseTagIds(raw?: string): number[] {
  if (!raw) {
    return [];
  }

  return raw
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isFinite(value) && value > 0);
}

function corsHeaders(origin: string | null, allowedOrigin?: string): HeadersInit {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  };

  if (allowedOrigin && origin === allowedOrigin) {
    headers['Access-Control-Allow-Origin'] = allowedOrigin;
  }

  return headers;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const origin = request.headers.get('Origin');
  const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, message: 'Method not allowed.' }, 405);
  }

  if (!env.KIT_API_SECRET || !env.KIT_FORM_ID) {
    return jsonResponse(
      {
        ok: false,
        message: 'Lead capture is not configured yet. Try again after launch setup completes.',
      },
      503,
    );
  }

  let payload: SubscribePayload;
  try {
    payload = (await request.json()) as SubscribePayload;
  } catch {
    return jsonResponse({ ok: false, message: 'Invalid request body.' }, 400);
  }

  if (payload.website) {
    return jsonResponse({ ok: true, message: 'Thanks.' });
  }

  const email = payload.email?.trim().toLowerCase() ?? '';
  const firstName = payload.first_name?.trim() ?? '';

  if (!email || !EMAIL_PATTERN.test(email)) {
    return jsonResponse({ ok: false, message: 'Please enter a valid email address.' }, 400);
  }

  const tagIds = parseTagIds(env.KIT_TAG_IDS);
  const kitBody: Record<string, unknown> = {
    api_key: env.KIT_API_SECRET,
    email,
  };

  if (firstName) {
    kitBody.first_name = firstName;
  }

  if (tagIds.length > 0) {
    kitBody.tags = tagIds;
  }

  const kitResponse = await fetch(`https://api.convertkit.com/v3/forms/${env.KIT_FORM_ID}/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
    },
    body: JSON.stringify(kitBody),
  });

  if (!kitResponse.ok) {
    const errorText = await kitResponse.text();
    console.error('Kit subscribe failed', kitResponse.status, errorText.slice(0, 500));
    return jsonResponse(
      {
        ok: false,
        message: 'We could not add you to the list right now. Please try again shortly.',
      },
      502,
    );
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: 'Subscribed.',
      form_id: payload.form_id ?? 'email_capture_v1',
      offer_id: payload.offer_id ?? 'newsletter_waitlist',
    }),
    {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    },
  );
};
