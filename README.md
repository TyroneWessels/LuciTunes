LuciTunes is a website I created that showcases music ive listened to and want to share with the world.

## Cloudflare Pages deployment

This site uses Cloudflare Pages Functions in `functions/api`. The browser calls these routes instead of accessing Supabase directly, so Supabase credentials are not included in the deployed JavaScript.

In Cloudflare Pages, connect this repository and use these build settings:

- Build command: leave blank
- Build output directory: `/`

Add these encrypted environment variables under **Settings > Environment variables** for both Preview and Production:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Use the Supabase **service_role** key only in Cloudflare. Never commit it or place it in an HTML or JavaScript file. For local Cloudflare development, create an untracked `.dev.vars` file:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Rotate the old publishable key in Supabase before deploying. Cloudflare will redeploy automatically after each push to the production branch.
