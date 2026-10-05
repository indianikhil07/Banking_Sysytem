# Simple Bank (OOP Banking System in JavaScript)

A browser version of a Python OOP banking system. Features: open account, deposit, withdraw, check balance, and a manager view (default manager code `234`).

## Files
- `index.html` – page structure
- `style.css` – styling
- `script.js` – `Account` and `Bank` classes plus UI logic

## Run locally
Open `index.html` in a browser. No build step or server is needed.

## Publish with GitHub Pages
1. Create a new repository on GitHub.
2. Upload `index.html`, `style.css`, `script.js` and `README.md` to the repository root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, set Source to **Deploy from a branch**, choose `main` and `/ (root)`, then Save.
5. After a minute your site is live at `https://<your-username>.github.io/<repo-name>/`.

## Notes
- Account data is saved in the browser's `localStorage`, so each visitor sees only their own data.
- This is a learning project: passwords and the manager code live in client-side code, so it is not secure. Do not enter real passwords.
- After 3 wrong passwords an account locks for 5 seconds (same idea as the original program).
