// Privacy Policy. Must match what the site actually does: a mismatch is a bug.
// Good-faith template, not legal advice (see README). TODO-BEE markers are listed in docs/BEE-TODO.md.
export default ctx => ({
  key: "privacy", path: "/privacy-policy", file: "privacy-policy.html", type: "trust",
  title: "Privacy Policy | Letterpile",
  description: "How Letterpile handles data, cookies and advertising, and your choices under GDPR, UK GDPR and US state privacy laws.",
  h1: "Privacy Policy",
  prose: `<p>This policy explains what happens to information when you use Letterpile (<a href="/">letterpile.app</a>). The short version: the word tools run in your browser, the site has no accounts, no database and no server code of its own, and it does not sell your data.</p>

<h2>Who runs this site</h2>
<p>Letterpile is run by ${ctx.site.operatorName}, based in ${ctx.site.country}. For anything in this policy, email <a href="mailto:${ctx.site.contactEmail}">${ctx.site.contactEmail}</a>. For the purposes of the GDPR and UK GDPR, the operator is the data controller for the processing described here that the site itself decides on.</p>
<!-- TODO-BEE: replace {{OPERATOR_NAME}} and {{CONTACT_EMAIL}} in site.config.json (see docs/BEE-TODO.md). -->

<h2>What the tools do with what you type</h2>
<p>Letters, words, patterns and filters you type into the tools are processed by JavaScript in your own browser. They are not sent to Letterpile or stored by it. To make results shareable, the tools put your input into the page address (for example <code>?letters=…</code>). That address stays in your browser history, and if you share the link, whoever receives it can see the input.</p>

<h2>Information stored on your device</h2>
<p>The site itself sets no cookies. It uses your browser's storage for a few preferences, which never leave your device:</p>
<ul>
  <li><b>localStorage, <code>theme</code></b>: whether you chose the light or dark theme.</li>
  <li><b>localStorage, <code>showAll</code></b>: whether you turned on “Show all words” in the tools.</li>
  <li><b>sessionStorage, <code>wordle</code></b>: the guesses you entered in the Wordle Solver, kept until you close the tab.</li>
</ul>
<p>You can clear these at any time in your browser settings.</p>

<h2>Hosting and delivery (Cloudflare)</h2>
<p>The site is delivered by Cloudflare, Inc. When your browser requests a page, Cloudflare necessarily processes your IP address and standard request information (such as the page requested, the time, your browser's user-agent string and referrer) to deliver the page, keep the service secure and protect it from abuse. Cloudflare acts as a service provider and may keep its own logs under its own policies; see the <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">Cloudflare privacy policy</a>. Letterpile has no server code and keeps no access logs of its own.</p>
<!-- TODO-BEE: if you turn on Cloudflare Web Analytics or any other analytics, this policy must be updated first. -->

<h2>Definition lookups (Free Dictionary API)</h2>
<p>When you tap a word, a small window shows its point value. Nothing is sent anywhere at that point. If you then press <b>Look up definition</b>, your browser asks the Free Dictionary API (<code>api.dictionaryapi.dev</code>), a third-party service, for that word. That request sends the word and, like any web request, your IP address and browser information to that service. Letterpile does not receive the request or its answer. The answer is kept in your browser's memory only until you leave the page. The links to Wiktionary and Merriam-Webster in that window simply open those websites, which have their own privacy policies.</p>

<h2>Advertising</h2>
<p>At the time of the last update, Letterpile shows no ads and sets no advertising cookies. The site may show ads served by Google in the future, to cover its costs. When it does, this section applies:</p>
<ul>
  <li>Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.</li>
  <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or other sites on the internet.</li>
  <li>You may opt out of personalized advertising by visiting <a href="https://adssettings.google.com" rel="noopener">Google Ads Settings</a>. You can also opt out of some third-party vendors' use of cookies for personalized advertising at <a href="https://www.aboutads.info" rel="noopener">www.aboutads.info</a>.</li>
  <li>Read <a href="https://policies.google.com/technologies/partner-sites" rel="noopener"><b>How Google uses data when you use our partners' sites or apps</b></a>.</li>
</ul>
<p>Ad technology can use cookies, web beacons (small invisible images or scripts), IP addresses and similar identifiers to show ads, limit how often you see the same ad, measure performance and prevent fraud.</p>
<!-- TODO-BEE: confirm this section once AdSense is approved and wired in; list any other ad partners here. -->

<h2>Consent in the UK, EEA and Switzerland</h2>
<p>Before any advertising or other non-essential cookies are used, visitors in the United Kingdom, the European Economic Area and Switzerland will be asked for consent through a Google-certified consent management platform. You will be able to change or withdraw your choice at any time through the “Privacy settings” link in the footer of every page.</p>
<!-- TODO-BEE: to be confirmed once the consent platform is wired in (unhide the footer "Privacy settings" link at the same time). -->

<h2>Your rights under the GDPR and UK GDPR</h2>
<p>If you are in the EEA, the UK or Switzerland, you have the right to ask for access to personal data held about you, to have it corrected or erased, to restrict or object to its processing, to data portability, and to withdraw consent at any time where processing is based on consent. Because Letterpile itself stores no personal data about visitors, most requests will concern the providers named above, and we will help you reach them.</p>
<p>The legal bases are: legitimate interests in delivering a secure, working website (hosting and delivery); your request (a definition lookup you start); and consent (personalized advertising and non-essential cookies, once used). You also have the right to complain to your local data protection supervisory authority.</p>
<p>Some of the providers named here may process data in countries other than your own, including the United States. Where that happens, they say they rely on recognized legal mechanisms for international transfers; their own privacy policies give the details.</p>

<h2>US state privacy rights (including California)</h2>
<p>In the last 12 months the site has not sold personal information and has not shared it for cross-context behavioral advertising. The categories of personal information involved in using the site are internet identifiers (such as IP address) and internet activity (such as pages requested), processed by the hosting provider as described above. If advertising is turned on, the use of advertising cookies may count as “sharing” under some US state laws; you will then be able to opt out through the US state privacy message shown on the site and through the footer “Privacy settings” link. You will not be treated differently for using your privacy rights. To make a request, email the address above.</p>
<!-- TODO-BEE: confirm the US states privacy message (Google Privacy & messaging) when advertising is turned on. -->

<h2>New Zealand Privacy Act 2020</h2>
<p>Letterpile is operated from New Zealand and aims to handle personal information in line with the New Zealand Privacy Act 2020. You can ask for access to, or correction of, personal information held about you by emailing the address above, and you can complain to the Office of the Privacy Commissioner if you are not satisfied with the response.</p>

<h2>Children</h2>
<p>Letterpile is a general-audience site and is not directed at children under 13. It does not knowingly collect personal information from children.</p>

<h2>Changes to this policy</h2>
<p>If the site's data practices change (for example when advertising is turned on), this page will be updated first and the “Last updated” date above will change.</p>`,
});
