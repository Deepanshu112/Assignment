# Amazon Listing Optimizer

This project is a small web app that fetches Amazon product details by ASIN, uses an AI model to generate improved listing copy (title, bullet points, description, and keyword suggestions), and stores optimization history in MySQL.

This README explains setup, required environment variables, the AI prompt used, and reasoning behind key design choices.

---

## Tech stack
- Backend: Node.js (Express)
- Frontend: React (Create React App)
- Database: MySQL (via `mysql2`)

## Project layout
- `backend/` - Express server, routes, services (scraper, AI, DB)
- `frontend/` - React app (components, services)
- `database/` - SQL setup script

## Quick setup

1. Install Node deps for both backend and frontend

```cmd
cd C:\Users\DELL\Desktop\assignment\backend
npm install

cd ..\frontend
npm install
```

2. Prepare MySQL
- Create a MySQL database and user, or use the defaults in `.env`.
- You can run the SQL in `database/setup.sql` to create schema, or the backend will create the `optimizations` table on first run.

3. Environment variables
- Create a `.env` file in `backend/` with the following values:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=amazon_optimizer

# AI keys (one of these)
GEMINI_API_KEY=your_gemini_api_key_here
# or
OPENAI_API_KEY=your_openai_api_key_here

# Optional
PORT=5000
NODE_ENV=development
```

4. Start backend

```cmd
cd C:\Users\DELL\Desktop\assignment\backend
node server.js
```

5. Start frontend

```cmd
cd C:\Users\DELL\Desktop\assignment\frontend
npm start
```

Open `http://localhost:3000` and enter an ASIN to run an optimization.

## AI prompt (used by `backend/services/ai-service.js`)

The backend builds a prompt that asks the model to return a JSON object with the following shape:

```json
{
  "optimizedTitle": "...",
  "optimizedBulletPoints": ["...","...","...","...","..."],
  "optimizedDescription": "...",
  "keywords": ["kw1","kw2","kw3"]
}
```

The prompt (trimmed) instructs the model to:
- Produce a keyword-rich readable title (<=200 chars)
- Re-write 5 concise benefit-first bullet points
- Produce a persuasive, policy-compliant description
- Suggest 3–5 keywords (long-tail and high-intent)

The full prompt text is in `backend/services/ai-service.js` in the `createOptimizationPrompt` function.

## Data storage
- The app saves optimizations to a MySQL table `optimizations` with fields for original and optimized titles, bullets, description, keywords (stored as JSON strings), and `created_at` timestamp.
- Endpoints:
  - `POST /api/optimize` — run an optimization for an ASIN (scrape + AI + save)
  - `GET /api/history/:asin` — get optimizations for a single ASIN
  - `GET /api/history` — get recent optimizations

## Frontend UI
- The main optimizer form is in `src/components/ASINForm.js`.
- The side-by-side comparison is implemented in `src/components/ComparisonView.js` — switch to the "Side-by-Side Comparison" tab to see original (left) vs optimized (right).
- History listing is in `src/components/HistoryView.js`.

## Resilience and parsing
- The AI parsing in `backend/services/ai-service.js` is hardened: the server logs raw AI responses and attempts multiple parsing strategies to extract the JSON object. If parsing fails, the backend falls back to a mock optimization (useful for development).

## Caveats and recommendations
- Scraping Amazon HTML is fragile and may fail due to layout changes or bot protections. For production, consider the Amazon Product Advertising API or official seller APIs.
- Ensure you do not commit API keys. Keep them in `.env` and use a secrets manager for production.
- Model responses may vary; prefer structured model APIs or response schemas to reduce parsing errors.

## Prompt reasoning
- The prompt focuses on SEO (keywords), readability (short, benefit-led bullets), and compliance (avoid disallowed claims). Returning a strict JSON object makes it straightforward to persist and render results in the UI.

---
If you'd like, I can add a runnable `README` section with example `.env` and a one-click script to initialize the DB.
