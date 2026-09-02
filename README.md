# Vocabulary Tracker 🗂️

A customisable, multi-language flash card vocabulary tracking system.

## Concept
- **Base Language:** The language you are fluent in, navigating the website in, and translating to in order to learn the study language. Defaults to your computer language (`navigator.language`).
- **Study Language:** The language you are actively learning, containing customized decks of vocabulary words.

---

## Screen Flow & Features

1. **Home Screen (`#/`)**
   - Elegant, minimalistic landing page with catchy slogan.
   - Base language selector, Light / Dark mode toggle.
   - Start button: routes to `#/languages` if signed in, or `#/signin` if unauthenticated.

2. **Sign In Screen (`#/signin`)**
   - Sign in with Google (via Google Identity Services).
   - Instant guest/preview mode.
   - Full manual OAuth setup instructions dialog.

3. **Study Languages Screen (`#/languages`)**
   - Tile grid of study languages with country flag emoji.
   - Add new study language modal with real-time search across 100+ world languages.
   - HTML5 drag-and-drop tile reordering (persisted).
   - Hide/Unhide toggle per language + "Show Hidden" button.

4. **Decks Screen (`#/languages/:code/decks`)**
   - 3 default decks auto-created: **Practicing**, **Mastered**, **All**.
   - Custom deck creation and drag-and-drop reordering.
   - Hide/Unhide deck with "Show Hidden" toggle.
   - Secure deck deletion modal requiring the user to type the deck name to confirm before deleting.

5. **Individual Deck Screen (`#/languages/:code/decks/:deckId`)**
   - Standard list view of vocabulary words.
   - Add new word modal (study word + base translation).
   - Move word dropdown per row to shift between decks.
   - Delete word action.
   - Sorting: Newest first, Alphabetical, or Custom (enables draggable row reordering).
   - **"All" Deck:** Read-only aggregate view across all decks for that language.
   - Prominent **"Study Deck"** button taking to flash cards.

6. **Flash Cards Study Screen (`#/languages/:code/decks/:deckId/study`)**
   - 3D flippable flash card.
   - Toggle to study front-to-back (**Study Language first** vs **Base Language first**).
   - Move word to another list mid-study (e.g. Practicing → Mastered).
   - Next / Previous card navigation, progress bar, shuffle mode.
   - Keyboard shortcuts: `[Space]` to flip, `[→]` for next, `[←]` for previous.

---

## Manual Steps Required

### 1. Google OAuth Client ID
1. Visit [Google Cloud Console → APIs & Credentials](https://console.cloud.google.com/apis/credentials).
2. Create credentials → **OAuth client ID** → **Web application**.
3. Add to **Authorized JavaScript origins**:
   - `https://nurihq.github.io`
   - `http://localhost:8080` (for local development)
   - Your custom domain (e.g. `https://vocab.nuri.software`)
4. Copy the Client ID into `config.js` (`GOOGLE_CLIENT_ID`).

### 2. GitHub Pages Deployment (Nuri GitHub)
1. Create a new repository on GitHub: `nurihq/vocab-tracker`.
2. Push this directory to the repository:
   ```bash
   git init
   git remote add origin git@github.com:nurihq/vocab-tracker.git
   git branch -M main
   git push -u origin main
   ```
3. Enable GitHub Pages under **Repository Settings → Pages → Deploy from branch (main / root)**.

### 3. Backend Deployment (Nuri AWS)
The backend is located at `~/focus/hustle/websites/saas/vocab-tracker/`.
Deploy to AWS using the `NuriAdmin` profile:
```bash
cd ~/focus/hustle/websites/saas/vocab-tracker
./deploy.sh
```
Once deployed, copy the CloudFormation output Function URLs into `config.js` (`API_ENDPOINTS`).

---

## Local Development
Run a local static server:
```bash
python3 -m http.server 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.
