// netlify/functions/paystack.js (CommonJS, no external deps)
const https = require("https");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
};

function paystackVerify(reference, secret) {
  return new Promise((resolve, reject) => {
    const path = `/transaction/verify/${encodeURIComponent(reference)}`;
    const options = { hostname: "api.paystack.co", path, method: "GET", headers: { Authorization: `Bearer ${secret}` } };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch (err) { reject(new Error("Invalid JSON from Paystack: " + err.message)); }
      });
    });
    req.on("error", (e) => reject(e));
    req.end();
  });
}

exports.handler = async function(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }

  const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET || "";

  try {
    if (event.httpMethod === "GET") {
      const ref = event.queryStringParameters && event.queryStringParameters.reference;
      if (!ref) {
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: true, message: "Backend connected successfully!" }) };
      }
      const resp = await paystackVerify(ref, PAYSTACK_SECRET);
      const ok = resp.body && resp.body.status && resp.body.data && resp.body.data.status === "success";
      return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify({ success: ok, data: resp.body }) };
    }

    if (event.httpMethod === "POST") {
      const body = event.body ? JSON.parse(event.body) : {};
      const reference = body.reference || body.ref || body.tx;
      if (!reference) {
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ success:false, message:"Missing reference" }) };
      }

      if (!PAYSTACK_SECRET) {
        return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success:false, message:"PAYSTACK_SECRET not set in environment" }) };
      }

      const resp = await paystackVerify(reference, PAYSTACK_SECRET);
      const verified = resp.body && resp.body.status && resp.body.data && resp.body.data.status === "success";
      return { statusCode: verified ? 200 : 400, headers: CORS_HEADERS, body: JSON.stringify({ success: verified, data: resp.body }) };
    }

    return { statusCode: 405, headers: CORS_HEADERS, body: JSON.stringify({ success:false, message:"Method Not Allowed" }) };
  } catch (err) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ success:false, error: err.message }) };
  }
};
