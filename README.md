# My Travel Diaries — your travel journal Trips Away from Home

A small multi-page travel site: a home page, one page per country, an about page,
and a "more countries" holding page for trips you haven't written up yet.
No build step — it's plain HTML/CSS/JS, so it works by just opening the files,
and deploys as a static site anywhere (Vercel, GitHub Pages, Netlify).

## What's inside
```
index.html            → home page (hero, stats, passport-stamp country rail)
about.html             → your bio + Instagram link
countries/
  singapore.html, malaysia.html, thailand.html, philippines.html,
  vietnam.html, maldives.html, india.html
  more.html            → placeholder grid for trips not written up yet
assets/css/style.css   → all styling, in one file
assets/js/main.js      → nav toggle, passport-stamp renderer, accordion,
                          lightbox gallery, scroll reveal animation
data.json               → the content for every country page (edit this)
templates/country.html.j2 → the template each country page is built from
gen.py                  → regenerates all /countries/*.html from data.json
```

## 1. Swap in your real photos
Every image right now is a placeholder from picsum.photos (a free placeholder
image service — they'll look like random stock photos, on purpose, so you can
judge the *layout* before committing real photos).

To swap them:
- Put your photos in an `assets/img/` folder (create it).
- Replace each `<img src="https://picsum.photos/seed/...">` with
  `<img src="../assets/img/your-photo.jpg">` (or `assets/img/...` on the home/about pages).
- Gallery photos are generated automatically from the `"gallery"` count in
  `data.json` for each place — easiest path is to rename your photo files
  to match the pattern the generator expects, or just hand-edit the `<figure>`
  blocks in the generated country page once you're happy with the picks.
- Keep photo file sizes reasonable (under ~500KB each) so pages load fast —
  any free tool like Squoosh.app can compress them.

## 2. Edit your content
Open `data.json`. Each country is one block with:
- `tagline`, `intro` — your words
- `places` — the stops within that country, each with a short note and tags
- `logistics` — flights, stay, transport, budget, best time to go
- `logistics.tickets` — this is where affiliate links go later (see below)

After editing `data.json`, regenerate the pages:
```
pip install jinja2
python3 gen.py
```
This rewrites everything in `/countries/`. Your hand-written `index.html`,
`about.html`, and `more.html` are not touched by this — edit those directly.

## 3. Adding a new country
1. Add a new block to `data.json` (copy an existing one as a starting point).
2. Run `python3 gen.py` — it generates the new page automatically.
3. Add a matching stamp card to the "Where I've been" rail in `index.html`
   (copy one `<a class="stamp-card">` block and change the text/link).
4. Optionally remove its placeholder card from `countries/more.html`.

## 4. Videos
Each country page can show one embedded YouTube video (only where `"video": true`
in data.json). Find the section with `<iframe src="https://www.youtube.com/embed/...">`
in the generated page and swap in your own video's ID — just the travel-relevant
ones from your channel, so the variety content stays off this site entirely.
Only YouTube's `/embed/` links are used, so nothing gets uploaded or hosted here.

## 5. Instagram links
There are three Instagram links total: the top nav, the about page, and the
footer. Search this project for `instagram.com/` and replace the `/` with your
handle, e.g. `instagram.com/yourhandle`. There is intentionally no link to
YouTube anywhere on the site.

## 6. Monetization hooks already built in
The "Booked & Used" panel on every country page (the `lc-tickets` section) is
built to hold affiliate links — flights, hotels, tours, gear. Right now every
link points to `#`. Once you have accounts with Booking.com, Klook,
GetYourGuide, Agoda, or Amazon Associates, replace the `"link": "#"` values in
`data.json` with your real affiliate URLs and re-run `gen.py`. This is the
most realistic near-term income path for a site like this — see the notes
your assistant gave you separately on other options (ads, digital products,
sponsorships).

## 7. Deploying
**Easiest: Vercel**
1. Push this folder to a GitHub repo.
2. Go to vercel.com → New Project → import the repo.
3. Framework preset: "Other" (it's static, no build command needed).
4. Deploy — you'll get a live URL in under a minute.

**Alternative: GitHub Pages**
1. Push to GitHub, go to repo Settings → Pages.
2. Set source to the `main` branch, root folder.
3. Your site will be live at `yourusername.github.io/reponame`.

Either way, custom domains can be attached later from the host's dashboard.

## 8. Before you launch
- [ ] Replace `[your name]` in `about.html`
- [ ] Replace every `instagram.com/` with your real handle
- [ ] Swap placeholder photos for real ones
- [ ] Swap placeholder video embeds for real ones (or remove the section)
- [ ] Double check costs/logistics numbers are accurate for readers
- [ ] Add a favicon (a 32×32 image at the project root named `favicon.ico`)
- [ ] Set up the "Plan a Trip" form (see below) so submissions actually reach you

## 9. Setting up the "Plan a Trip" form
This form uses **Formspree** — a free service that takes form submissions on a
static site (like this one, with no server of its own) and forwards them to
your email. It also gives you a private online dashboard to see every
submission, so you don't have to rely on email alone. Your email address is
never visible in the site's code — only Formspree sees it.

1. Go to [formspree.io](https://formspree.io) and sign up free with
   `srinivasjlkm@gmail.com`.
2. Click **New Form**, name it something like "Trip Requests."
3. Formspree gives you a form ID that looks like `https://formspree.io/f/abcd1234`.
4. Open `plan.html`, find this line near the bottom:
   ```js
   const FORMSPREE_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";
   ```
   Replace `YOUR_FORM_ID` with your real ID from step 3.
5. Re-upload `plan.html` to GitHub (same drag-and-drop process as before).
6. Formspree will send a verification email the first time someone submits —
   confirm it once, and every submission after that lands in your inbox,
   nicely formatted, plus you can log into formspree.io any time to see the
   full history of submissions.

The free Formspree plan covers 50 submissions a month, which is plenty to
start — you can upgrade later if the service takes off.
