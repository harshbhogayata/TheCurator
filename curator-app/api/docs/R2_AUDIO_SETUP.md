# Cloudflare R2 — permanent article/brief narration MP3s

Railway’s local disk is **ephemeral** (wiped on redeploy). R2 gives you permanent, CDN-friendly URLs at **$0 egress** to the internet.

## R2 free tier (2026)

| Resource | Free/month |
|----------|------------|
| Storage | 10 GB |
| Class A ops (writes) | 1 million |
| Class B ops (reads) | 10 million |
| Egress to internet | **$0** |

For Curator’s seed content (~20 articles + briefs, ~2–5 MB each), you stay well inside free tier.

## Setup (≈15 min)

### 1. Create bucket

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → **Create bucket**
2. Name: `curator-audio` (or your choice)
3. Location: auto

### 2. Enable public access (pick one)

**Option A — R2.dev subdomain (fastest)**  
R2 → bucket → **Settings** → **Public access** → Allow → copy public URL  
e.g. `https://pub-xxxx.r2.dev`

**Option B — Custom domain (recommended)**  
R2 → bucket → **Settings** → **Custom Domains** → e.g. `audio.thecuratorgroup.org`  
Add the CNAME Cloudflare shows in DNS.

### 3. Create API token

R2 → **Manage R2 API Tokens** → **Create API token**  
Permissions: **Object Read & Write** on `curator-audio`  
Save **Access Key ID** and **Secret Access Key**.

### 4. Railway environment variables

```env
TTS_PROVIDER=edge
AUDIO_STORAGE_BACKEND=s3
AUDIO_S3_ENDPOINT_URL=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
AUDIO_S3_BUCKET=curator-audio
AUDIO_S3_ACCESS_KEY_ID=<from step 3>
AUDIO_S3_SECRET_ACCESS_KEY=<from step 3>
AUDIO_S3_REGION=auto
AUDIO_PUBLIC_BASE_URL=https://audio.thecuratorgroup.org
API_PUBLIC_BASE_URL=https://thecurator-production-1b47.up.railway.app
```

Replace `<ACCOUNT_ID>` with your Cloudflare account ID (R2 overview page).

### 5. Verify & backfill

```bash
cd curator-app/api
python manage.py verify_audio_storage
python manage.py generate_content_audio --all-missing
```

`verify_audio_storage` uploads a tiny test MP3 and prints the public URL.

### 6. CORS (only if mobile loads MP3 cross-origin)

R2 bucket → **Settings** → **CORS**:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

Expo `expo-av` fetches MP3 by URL; permissive GET is usually enough.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `403` on MP3 URL | Enable public access or custom domain |
| `verify_audio_storage` fails auth | Re-check API token scope and account ID in endpoint URL |
| Audio 404 after deploy | Run `generate_content_audio --all-missing` once R2 is wired |
| Still using local disk | Set `AUDIO_STORAGE_BACKEND=s3` explicitly |
