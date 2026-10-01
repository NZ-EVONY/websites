// Reserved ad container. No ad code: Bee pastes the AdSense <ins> unit at the comment
// once AdSense is approved. Heights are reserved in CSS (--ad-h) so nothing shifts.
export default function adSlot(name, { dev = false } = {}) {
  return `<!-- AD SLOT: ${name}. Paste AdSense <ins> unit here. Do not auto-refresh. -->
<aside class="ad-slot${dev ? " ad-slot--dev" : ""}" data-ad-slot="${name}" aria-label="Advertisement"><span class="ad-label">Advertisement</span><div class="ad-slot__inner" data-ad-placeholder></div></aside>`;
}
