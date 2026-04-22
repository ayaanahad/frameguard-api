export default async function handler(req, res) {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: "Missing URL"
    });
  }

  try {
    let target;
    try {
      target = new URL(url);
    } catch {
      return res.status(400).json({
        success: false,
        error: "Invalid URL"
      });
    }

    const response = await fetch(target.toString(), {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Phototul Embed Checker)"
      }
    });

    const finalUrl = response.url;

    const xfo = response.headers.get("x-frame-options") || "";
    const csp = response.headers.get("content-security-policy") || "";

    const xfoVal = xfo.toLowerCase();
    const cspVal = csp.toLowerCase();

    let risk = "low"; // low | medium | high
    let signals = [];

    // 🔴 Strong block signals
    if (xfoVal.includes("deny")) {
      risk = "high";
      signals.push("xfo=deny");
    }

    if (cspVal.includes("frame-ancestors") && cspVal.includes("'none'")) {
      risk = "high";
      signals.push("csp=none");
    }

    // ⚠️ Medium signals
    if (xfoVal.includes("sameorigin")) {
      risk = "medium";
      signals.push("xfo=sameorigin");
    }

    if (cspVal.includes("frame-ancestors")) {
      risk = "medium";
      signals.push("csp=restricted");
    }

    return res.status(200).json({
      success: true,
      risk,              // 🔥 IMPORTANT (not canEmbed)
      signals,
      headers: {
        xFrameOptions: xfo || null,
        contentSecurityPolicy: csp || null
      },
      finalUrl
    });

  } catch (err) {
    return res.status(200).json({
      success: false,
      risk: "high",
      signals: ["request_failed"],
      error: err.message
    });
  }
}