export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow"
    });

    const xfo = response.headers.get("x-frame-options") || "";
    const csp = response.headers.get("content-security-policy") || "";

    const xfoVal = xfo.toLowerCase();
    const cspVal = csp.toLowerCase();

    let canEmbed = true;
    let reason = "allowed";

    // ✅ X-Frame-Options check
    if (xfoVal.includes("deny")) {
      canEmbed = false;
      reason = "xfo=deny";
    }

    if (xfoVal.includes("sameorigin")) {
      canEmbed = false;
      reason = "xfo=sameorigin";
    }

    // ✅ CSP frame-ancestors check
    if (cspVal.includes("frame-ancestors")) {
      if (cspVal.includes("'none'")) {
        canEmbed = false;
        reason = "csp=none";
      } else if (!cspVal.includes("*")) {
        // ⚠️ unknown origin restriction
        canEmbed = false;
        reason = "csp=restricted";
      }
    }

    return res.json({
      success: true,
      canEmbed,
      reason,
      xfo,
      csp
    });

  } catch (err) {
    return res.json({
      success: false,
      canEmbed: false,
      reason: "request_failed",
      error: err.message
    });
  }
}