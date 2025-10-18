// netlify/functions/paystack.js (TEMP DEBUG)
exports.handler = async function(event) {
  const headers = event.headers || {};
  const method = event.httpMethod || "UNKNOWN";
  const qs = event.queryStringParameters || {};
  let body = event.body || null;
  try { body = body ? JSON.parse(body) : null; } catch(e){ /* keep raw */ }

  const envHas = !!process.env.PAYSTACK_SECRET;
  const PAYSTACK_SECRET = envHas ? "[SET]" : "[NOT SET]";

  const payload = {
    message: "DEBUG: paystack function received request",
    method,
    path: event.path,
    query: qs,
    headers: {
      host: headers.host,
      origin: headers.origin,
      referer: headers.referer || headers.Referer || null,
      "content-type": headers["content-type"] || headers["Content-Type"] || null,
      "x-nf-path": headers["x-nf-path"] || null
    },
    body,
    env_PAYSTACK_SECRET: PAYSTACK_SECRET
  };

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(payload, null, 2)
  };
};
