export default function handler(req, res) {
  res.status(200).json({
    name: "FrameGuard API",
    status: "running",
    endpoint: "/api/check?url=https://example.com"
  });
}