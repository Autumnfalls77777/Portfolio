# Prabal Jaiswal — Space Portfolio (Decap CMS Edition)

Your portfolio website, now powered by **Decap CMS + GitHub + Netlify**.  
No database. No Supabase. Just static files and a free CMS admin panel.

---

## 🚀 How It Works

```
You edit content at /admin
        ↓
Decap CMS commits JSON files to your GitHub repo
        ↓
Netlify detects the commit and rebuilds (10–60 seconds)
        ↓
Live site updates automatically ✅
```

---

## 📁 Folder Structure

```
portfolio/
├── index.html              ← Your website (design unchanged)
├── netlify.toml            ← Netlify build config
├── generate-manifests.js   ← Auto-runs on every deploy
├── admin/
│   ├── index.html          ← Decap CMS admin UI
│   └── config.yml          ← CMS collections config ← EDIT THIS FIRST
├── _data/
│   └── settings.json       ← Site name, bio, socials, hero photo
├── content/
│   ├── projects/
│   │   ├── manifest.json   ← Auto-generated list of project files
│   │   └── *.json          ← One JSON file per project
│   └── certificates/
│       ├── manifest.json   ← Auto-generated list of certificate files
│       └── *.json          ← One JSON file per certificate
└── images/
    └── uploads/            ← Images uploaded via CMS admin panel
```

---

## ⚡ One-Time Setup (15 minutes)

### Step 1 — Push to GitHub

1. Create a new GitHub repository (e.g. `Portfolio`)
2. Upload all files from this zip into it  
   *(or `git init`, `git add .`, `git commit -m "init"`, `git push`)*

### Step 2 — Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
2. Connect your GitHub account and choose your repo
3. Build settings will be auto-detected from `netlify.toml`
4. Click **Deploy** — your site will be live in ~1 minute
5. Note your Netlify URL (e.g. `https://prabal-portfolio.netlify.app`)

### Step 3 — Enable GitHub OAuth for CMS Login

This lets you log into `/admin` using your GitHub account:

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **OAuth Apps → New OAuth App**
3. Fill in:
   - **Application name**: Portfolio CMS
   - **Homepage URL**: `https://YOUR_NETLIFY_SITE.netlify.app`
   - **Authorization callback URL**: `https://api.netlify.com/auth/done`
4. Click **Register** — copy the **Client ID** and generate a **Client Secret**
5. In Netlify → **Site Settings → Access control → OAuth**:
   - Provider: GitHub
   - Client ID: *(paste)*
   - Client Secret: *(paste)*
   - Click **Install**

### Step 4 — Update config.yml

Edit `admin/config.yml` and replace the placeholder values:

```yaml
backend:
  name: github
  repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME   # e.g. Autumnfalls77777/Portfolio
  branch: main
  base_url: https://YOUR_NETLIFY_SITE.netlify.app  # e.g. https://prabal-portfolio.netlify.app

site_url: https://YOUR_NETLIFY_SITE.netlify.app
```

Commit and push this change. Netlify will redeploy automatically.

---

## 🎛️ Using the Admin Panel

1. Visit `https://YOUR_SITE.netlify.app/admin`
2. Click **Login with GitHub** — authorize the app
3. You're in! Use the left sidebar to:
   - **⚙️ Site Settings** — change name, bio, hero photo, social links
   - **🚀 Projects** — add, edit, delete projects
   - **🎓 Certificates** — add, edit, delete certificates
4. Click **Publish** (or **Save** then **Publish**)
5. Wait ~30–60 seconds → your live site updates!

---

## 📋 Adding a Project

In the admin panel:
1. Click **🚀 Projects → New Project**
2. Fill in:
   - **Title** — project name
   - **Category** — Graphic / Coding / Server / Others
   - **Banner Image** — drag & drop or click to upload
   - **Detail Image** — optional larger image for the modal
   - **Description** — what the project is about
   - **Key Highlights** — up to 4 bullet points
   - **Tech Stack** — comma-separated list
   - **Live URL** / **GitHub URL** — optional links
   - **Code Snippet** — optional code to display in the modal
3. Click **Publish**
4. Site updates in ~60 seconds ✅

---

## 📋 Adding a Certificate

1. Click **🎓 Certificates → New Certificate**
2. Fill in:
   - **Title** — certificate name
   - **Issuing Organization** — e.g. Coursera, NPTEL
   - **Issue Date** — date picker
   - **Category** — College / Events / Internship
   - **Certificate Image** — upload a photo/screenshot
3. Click **Publish** ✅

---

## 🖼️ Updating Your Profile Photo

1. Go to **⚙️ Site Settings → General Settings**
2. Click the **Profile / Hero Image** field → upload your photo
3. Click **Publish** ✅

---

## 🔧 How Manifests Work

Every time Netlify builds your site, it runs `generate-manifests.js` which:
- Scans `content/projects/` for all `.json` files
- Scans `content/certificates/` for all `.json` files
- Writes `manifest.json` in each folder listing them

The website JavaScript fetches the manifest first, then loads each content file. This means the site always shows exactly what's in your repo — no database needed.

---

## ❓ FAQ

**Q: Can I use a custom domain?**  
A: Yes. In Netlify → Domain Settings → Add custom domain. Update `config.yml` with your domain too.

**Q: What if my admin panel shows a blank page?**  
A: Make sure Steps 3 and 4 are complete (GitHub OAuth + config.yml updated with your real URLs).

**Q: How do I add a custom domain email for the admin login?**  
A: Decap CMS uses GitHub OAuth — you log in with your GitHub account, no separate email needed.

**Q: Can I reorder projects?**  
A: The site shows projects in reverse alphabetical order by filename. To control order, prefix filenames with numbers like `01-brand-design.json`, `02-portfolio.json`.

**Q: Is this free?**  
A: Yes. GitHub (free), Netlify (free tier), Decap CMS (free, open source).

---

## 🆘 Quick Troubleshooting

| Problem | Fix |
|---|---|
| Admin panel blank | Check `config.yml` has your real repo + Netlify URL |
| Login fails | Complete GitHub OAuth setup in Netlify (Step 3) |
| Projects not showing | Make sure `manifest.json` lists the right filenames |
| Images not loading | Check the image path in the JSON file matches what CMS uploaded |
| Site not updating | Check Netlify deploy logs for build errors |
