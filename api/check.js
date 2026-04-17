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

    const xfo = response.headers.get("x-frame-options");
    const csp = response.headers.get("content-security-policy");

    let canEmbed = true;

    const xfoVal = xfo ? xfo.toLowerCase() : "";
    const cspVal = csp ? csp.toLowerCase() : "";

    // 🔥 Fast block detection
    if (xfoVal.includes("deny") || xfoVal.includes("sameorigin")) {
      canEmbed = false;
    }

    if (cspVal.includes("frame-ancestors")) {
      if (cspVal.includes("'none'") || cspVal.includes("'self'")) {
        canEmbed = false;
      }
    }

    // 🚀 If clearly blocked → stop
    if (!canEmbed) {
      return res.json({ canEmbed: false });
    }

    // 🔥 Call Railway (real detection)
    let data = { canEmbed: true };

    try {
      const railway = await fetch(
        `https://railway-iframe-check-api-production.up.railway.app/check?url=${encodeURIComponent(url)}`
      );

      data = await railway.json();
    } catch {
      data = { canEmbed: true };
    }

    return res.json(data);

  } catch {
    return res.json({ canEmbed: true });
  }
}