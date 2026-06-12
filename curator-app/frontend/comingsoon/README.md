# Curator Coming Soon

This is the Cloudflare Workers static-assets version of the public launch page.
It is intentionally self-contained: the homepage keeps CSS and JavaScript inline
so it cannot degrade into an unstyled page because of missing asset paths.

Deploy after Cloudflare login:

```powershell
cd C:\Users\harsh\Desktop\Curator\curator-app\frontend\comingsoon
npx wrangler login
npx wrangler deploy --config wrangler.jsonc
```

The worker name is `curator`, matching `curator.<account>.workers.dev`.
