// Contact. No form (avoids collecting personal data); email only.
export default ctx => ({
  key: "contact", path: "/contact", file: "contact.html", type: "trust",
  title: "Contact Letterpile",
  description: "How to contact the person who runs Letterpile for corrections, questions or privacy requests.",
  h1: "Contact",
  prose: `<p>Letterpile is run by ${ctx.site.operatorName} in ${ctx.site.country}. The best way to get in touch is by email:</p>
<p class="contact-email"><a href="mailto:${ctx.site.contactEmail}">${ctx.site.contactEmail}</a></p>

<h2>What to write about</h2>
<ul>
  <li><b>Wrong or missing results.</b> Tell us which tool, what you typed and what you expected. Remember that the tools use the open ENABLE word list, so a word your game accepts may not be in it, and the other way round. That is not always a bug, but it is useful to know about.</li>
  <li><b>Broken pages or layout problems.</b> Mention the page address, your browser and device.</li>
  <li><b>Words that should be hidden.</b> If a tool shows a word you think is offensive, say which one.</li>
  <li><b>Privacy requests.</b> Questions about the <a href="/privacy-policy">Privacy Policy</a>, or requests under privacy laws such as the GDPR, UK GDPR, US state privacy laws or the New Zealand Privacy Act 2020.</li>
  <li><b>Abuse or legal concerns</b>, including trademark questions.</li>
</ul>

<h2>Making a privacy request</h2>
<p>Letterpile itself keeps no accounts, no database and no logs, so there is usually nothing stored about you here. Requests about your data are still welcome. To help answer quickly, please say:</p>
<ul>
  <li>what you are asking for (for example access, correction, deletion or an opt-out);</li>
  <li>which law you are relying on, if you know (for example the GDPR, UK GDPR, a US state privacy law or the New Zealand Privacy Act 2020);</li>
  <li>which country you live in.</li>
</ul>
<p>You don't need to send any identity documents unless a reply asks for something specific.</p>

<h2>What to expect</h2>
<p>Letterpile is a one-person project, so replies can take a while. Every message is read, and corrections are fixed as soon as practical. There is no phone line and no contact form, so that the site doesn't have to store your details. Your email is used only to reply to you.</p>

<h2>Before you write</h2>
<p>The <a href="/about">About page</a> explains how the tools and the word list work, and the <a href="/terms">Terms of Use</a> cover what the site does and doesn't promise.</p>`,
});
