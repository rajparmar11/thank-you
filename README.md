# Chelsi's Little Corner

This repo is now set up for a simple Netlify deploy.

Netlify should publish the `site` folder. The root `netlify.toml` already tells Netlify that, so you can deploy from GitHub without touching the older Next.js files.

## Deploy On Netlify

1. Push this folder to GitHub.
2. In Netlify, choose **Add new site** -> **Import an existing project**.
3. Pick your GitHub repo.
4. Netlify should read `netlify.toml` automatically.
5. Use these settings if Netlify asks:

```txt
Build command: echo Static site ready
Publish directory: site
```

6. Click **Deploy site**.

## Preview Locally

```bash
node preview-server.cjs
```

Then open:

```txt
http://127.0.0.1:4173
```

## Editing Content

Most text, cards, story entries, notes, prompts, photos, and the song settings are in:

```txt
site/content.json
```

Photos and audio are in:

```txt
site/assets
```

Keep the file names in `content.json` matching the files in `site/assets`.

## Chelsi Submissions

The **Your Side** form uses Netlify Forms. After deployment, submissions appear in your Netlify dashboard under **Forms**.

## Important

This Netlify version is intentionally static so it deploys easily. It keeps the same website/interface, music player, secret room, gallery, notes, open-when envelopes, and Back to Us page.

There is no private server database/admin login in this simple version. To change public content, edit `site/content.json` and redeploy.
