# Wine Bar on the River — "Let's Keep in Touch"

A simple, easy-to-read landing page where guests join the list to receive
**event invitations** and **news about new wine selections**.

- Built as a plain static site (no build step) for **Netlify**.
- Sign-ups are captured by **Netlify Forms** and copied automatically into a
  **Google Sheet**.
- **No tracking:** no analytics, no cookies, no third-party trackers.

👉 **Full step-by-step setup instructions are in [SETUP.md](./SETUP.md).**

## Preview locally

Open `index.html` in a web browser, or serve the folder:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

Note: the form only records submissions once the site is deployed to
Netlify (see SETUP.md).
