# Chelsi's Little Corner

A private interactive website made by Raj for Chelsi: scrapbook, memory box, secret room, song centerpiece, contribution space, and a soft doorway back to normal conversation.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and change every secret:

```bash
ADMIN_EMAIL=raj@example.com
ADMIN_PASSWORD=use-a-private-password
SESSION_SECRET=use-a-long-random-string
DATABASE_PATH=./data/chelsi.sqlite
```

3. Run the app:

```bash
npm run dev
```

Open `http://127.0.0.1:3000`.

## Admin

Open `/admin` and sign in with the email/password from `.env`.

The admin dashboard manages homepage cards, story timeline entries, private notes, open-when envelopes, gallery photos, the current song and archived songs, observations, scenarios, Back to Us prompts, Easter eggs, user submissions, and activity.

Admin credentials are only checked server-side. They are not shipped in frontend code.

## Privacy

Activity tracking is intentionally limited to visit/session events, opened pages, approximate duration, broad device category, and interaction metadata. It does not collect GPS, exact location, contacts, camera, microphone, private files, or hidden personal data.

## Uploads

Admin uploads are stored in `public/uploads`. Supported files are JPG, PNG, WEBP, MP3, WAV, and OGG under 12 MB.

## Notes

The app seeds initial sample content from the included photos and `song.mp3`. Replace all sample text, photos, songs, prompts, and secrets from the admin panel whenever Raj is ready.
