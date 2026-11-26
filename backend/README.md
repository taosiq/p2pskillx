# P2PSkillX secure backend

A free Cloudflare Worker that handles everything the app can't be trusted to do
itself. No credit card is needed on Cloudflare's free plan (100,000 requests a day).

| Endpoint | What it does |
|---|---|
| `POST /v1/quiz/start` | Writes a quiz with AI (OpenRouter, falls back to the built-in question banks). The answer key is encrypted inside a token, so the phone never sees it. Limits: 20 quizzes a day, 10-minute cooldown after a failed attempt. |
| `POST /v1/quiz/submit` | Grades the quiz on the server (each quiz can be submitted once) and adds the verified skill to the profile. |
| `POST /v1/courses/enroll` | In one transaction: checks the balance, takes the credits, enrols the learner, and pays the instructor 80% of the price. |
| `POST /v1/profile/sync` | Daily streak, XP, level and tier, all calculated on the server. Pays tier rewards once each. Moves old private fields (email, date of birth, gender) out of the public profile. |
| `POST /v1/account/cleanup` | Before an account is deleted: removes its posts, notifications and follow links. |
| `GET /health` | Returns `{ "ok": true }`. |

Every request must carry the signed-in user's Firebase ID token, which the
Worker verifies against Google's public keys.

---

## One-time setup (about 15 minutes)

You need: a free Cloudflare account, and access to the Firebase console for
project `p2pskillx-e5c83`.

### 1. Create a Firebase service account key
Firebase console → ⚙ Project settings → **Service accounts** → **Generate new private key**.
A JSON file downloads. Treat it like a password: never commit it or share it.

### 2. Install and sign in to Cloudflare
```
cd backend
npm install
npx wrangler login
```

### 3. Store the three secrets
Run each command and paste the value when asked:
```
npx wrangler secret put OPENROUTER_API_KEY
npx wrangler secret put QUIZ_SECRET
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
```
- `OPENROUTER_API_KEY`: your OpenRouter key.
- `QUIZ_SECRET`: any long random string, for example from `node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"`.
- `FIREBASE_SERVICE_ACCOUNT`: the **entire contents** of the JSON file from step 1, on one line.

Then delete the downloaded JSON file.

### 4. Deploy
```
npm run deploy
```
Wrangler prints a URL like `https://p2pskillx-api.<your-subdomain>.workers.dev`.
Check it: opening `<url>/health` should show `{"ok":true}`.

### 5. Point the app at it
In the app's `app.json`, set:
```json
"extra": { "apiUrl": "https://p2pskillx-api.<your-subdomain>.workers.dev" }
```
Restart Expo (`npx expo start -c`). The app now uses the server for quizzes,
enrolment and XP, and stops loading the OpenRouter key.

### 6. Lock down the database (do this last)
Only after steps 1–5 work, deploy the security rules and indexes from the project root:
```
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```
From then on, clients can't change credits, XP, levels, verified skills or enrolments.

### 7. Remove the key from the app
Once the server works, open `api-keys.js` and set `OPENROUTER_API_KEY = ''`.
The key then exists only on the server. Also create a **new** OpenRouter key
and delete the old one, because it was previously built into the app.

---

## Local development
```
npm run dev      # runs the Worker at http://localhost:8787 (put secrets in backend/.dev.vars)
npm test         # unit tests (quiz sealing, question cleaning, Firestore encoding)
```
`.dev.vars` (git-ignored) uses the same names as the secrets:
```
OPENROUTER_API_KEY=...
QUIZ_SECRET=...
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

## Settings (`wrangler.toml`)
| Variable | Default | Meaning |
|---|---|---|
| `AI_MODELS` | 3 free models | OpenRouter models, tried in order |
| `QUIZ_STARTS_PER_DAY` | 20 | Quiz limit per user per day |
| `FAIL_COOLDOWN_MINUTES` | 10 | Wait before retrying a failed skill |
| `INSTRUCTOR_SHARE` | 0.8 | Share of the course price paid to the instructor (the rest leaves the economy, which keeps credits from inflating) |
