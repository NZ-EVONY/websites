// AdSense integration point (in <head>, after the CMP slot). Only a comment: Bee pastes the
// verification meta tag and the loader snippet exactly as her AdSense account shows them.
export default function adsenseSlot() {
  return `<!-- ==== ADSENSE INTEGRATION POINT. After AdSense approval paste here, exactly as the AdSense account shows them:
  1. the <meta name="google-adsense-account" content="ca-pub-XXXXXXXXXXXXXXXX"> verification tag (placeholder id shown; never guess the real one)
  2. the AdSense loader script snippet.
Then add the CSP origins listed in public/_headers and update public/ads.txt. Must load AFTER the CMP snippet above. See docs/BEE-TODO.md ==== -->`;
}
