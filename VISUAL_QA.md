# Visual QA

UI changes are not verified by source review alone.

- For a browser-renderable surface that has a public or safe preview URL, prefer the shared public `hipdiscovery/visual-qa` GitHub-hosted runner. It should render the real UI at representative desktop/mobile sizes and produce screenshots that an agent actually inspects before calling visual work finished.
- Routine QA must not depend on a persistent process on Troy's PC: no always-on local server, installer, startup service, Cloudflare Tunnel, or command window left open.
- Avoid usage-metered browser-rendering services for normal iteration.
- Keep private source, credentials, tokens, cookies, and secrets out of the public QA repo. The runner should visit public/safe URLs only.
- For native or localhost-only UI that the shared runner cannot reach, use the project's own simulator/browser-source/UI-test screenshots and inspect those instead. Do not claim the public browser runner verified a surface it cannot render.
- Automated layout/accessibility tests are a second layer, not a substitute for looking at the rendered UI.
- If the shared runner is unavailable, say visual verification was unavailable rather than claiming a visual pass.
- Prefer replacing a small `latest` report/screenshots over accumulating large QA artifacts.
