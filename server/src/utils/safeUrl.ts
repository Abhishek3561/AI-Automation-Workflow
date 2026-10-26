// basic guard so workflows and agents can't call your own machine or private network
export function assertSafeUrl(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(u.protocol)) {
    throw new Error("Only http and https URLs are allowed");
  }
  const h = u.hostname;
  const blocked =
    h === "localhost" ||
    h === "0.0.0.0" ||
    h === "[::1]" ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h);
  if (blocked) throw new Error("That URL points to a private address and is blocked");
}