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

    if (xfoVal.includes("deny") || xfoVal.includes("sameorigin")) {
      canEmbed = false;
    }

    if (cspVal.includes("frame-ancestors")) {
      if (cspVal.includes("'none'") || cspVal.includes("'self'")) {
        canEmbed = false;
      }
    }

    return res.json({ canEmbed });

  } catch {
    return res.json({ canEmbed: true });
  }
}