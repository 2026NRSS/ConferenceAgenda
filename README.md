# 2026 National Rural STEM Summit - attendee website

A mobile-first, static conference web app designed for GitHub Pages.

## Files to upload to the repository root

Upload **everything in this folder**, preserving the `assets/` folder:

- `index.html`
- `styles.css`
- `app.js`
- `conference-data.json`
- `manifest.json`
- `service-worker.js`
- `404.html`
- `assets/`

## Turn on GitHub Pages

1. Open the GitHub repository.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder.
5. Save. GitHub will display the public site address after deployment.

## Campus map

The annotated campus map was not available in the supplied files when this package was generated.

When you have it, name the image:

`campus-map.png`

and upload it into:

`assets/campus-map.png`

No HTML changes are required; the map will automatically replace the placeholder.

## Privacy

`conference-data.json` was generated from the **2026 Master Agenda list** tab only. Presenter email addresses and form submission timestamps are deliberately excluded from this package.

## Updating the agenda

The website reads public attendee data from `conference-data.json`. Updating the source Google Sheet does **not** automatically update this version of the GitHub site. Regenerate or replace `conference-data.json` when the agenda changes.

## Custom domain / subdomain

After GitHub Pages is working, a domain administrator can point a subdomain such as `summit.example.org` or `schedule.example.org` to GitHub Pages and then enter that subdomain under **Settings > Pages > Custom domain**.

## Notes

- Favorites are stored in the attendee's browser using local storage; there are no attendee accounts.
- The site includes a Progressive Web App manifest and basic offline caching.
- Presenter headshots use sanitized public Google Drive image URLs where available and fall back to initials if an image cannot load.


## V2 presenter cleanup
- Presenter profiles are now individual people rather than combined pairs.
- Sessions may reference multiple individual presenters.
- Bios/headshots are assigned only when the source sheet supports that individual attribution.
- Missing second-presenter bios/headshots are intentionally left blank rather than copied from a co-presenter.


## V3 branding/location fixes
- Changed every Room 5 session to Dobbelaere/Science Hall Room 143.
- Replaced the summit logo with the supplied NRSS logo.
- Replaced SRP, Freeport-McMoRan, Kemper and Ethel Marley Foundation, and Burton Family Foundation graphics with the supplied image files.
