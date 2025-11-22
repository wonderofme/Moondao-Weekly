# MoonDAO Weekly Summarizer 🌑

An automated tool that generates and sends weekly Town Hall summaries using AI. It downloads audio from YouTube, transcribes it, generates a summary, and broadcasts it to an email list.

**Live Demo:** [moon-dao-weekly.vercel.app](https://moon-dao-weekly.vercel.app)

## 🚀 Features

-   **Automated Workflow:** YouTube URL $\rightarrow$ Audio Download $\rightarrow$ Transcription $\rightarrow$ Summarization $\rightarrow$ Email Broadcast.
-   **AI Power:**
    -   **AssemblyAI:** High-accuracy audio transcription.
    -   **Google Gemini:** Smart summarization focused on DAO governance (deadlines, proposals, updates).
-   **Email Integration:** Connects with **Kit (ConvertKit)** to send formatted broadcasts to unlimited subscribers.
-   **Admin Panel:** Secure interface to trigger the process, preview summaries, and edit them before sending.
-   **Preview & Regenerate:** Review the AI summary and prompt it to make changes (e.g., "Make it more concise") before finalizing.
-   **Bot Defense:** Handles YouTube bot protection using cookie authentication.

## 🛠 Tech Stack

-   **Frontend:** Next.js 15 (App Router), TailwindCSS, Framer Motion (vibes).
-   **Backend:** Python Serverless Functions (Vercel), `yt-dlp` (audio), `requests`.
-   **Hosting:** Vercel.

---

## ⚙️ Setup Guide

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd moondao-weekly
npm install
```

### 2. Get Your API Keys
You will need free accounts for the following services:

1.  **Google AI Studio (Gemini):** [Get API Key](https://aistudio.google.com/)
2.  **AssemblyAI:** [Get API Key](https://www.assemblyai.com/)
3.  **Kit (ConvertKit):**
    -   Sign up at [kit.com](https://kit.com).
    -   Go to **Settings** $\rightarrow$ **Developer** to get your `API Secret`.
    -   Create a Form (for subscribers) and find the `Form ID` in the URL or settings.

### 3. Configure Environment Variables
1.  Rename `env.example` to `.env.local`.
2.  Fill in your keys (see `env.example` for all available options):
    ```ini
    GEMINI_API_KEY=...
    ASSEMBLYAI_API_KEY=...
    KIT_API_SECRET=...
    KIT_FORM_ID=...
    ADMIN_PASSWORD=... # Set a strong password for the /admin page
    ```
   **Note:** `GEMINI_MODEL_NAME` and `KIT_EMAIL_TEMPLATE_ID` are optional. Leave `YTDLP_COOKIES_BASE64` empty if you don't need YouTube cookie authentication.

### 4. YouTube Cookies (Crucial for `yt-dlp`)
YouTube often blocks server-side downloads. To bypass this, you must feed your browser's cookies to the app.

1.  **Export Cookies:** Use a browser extension like "Get cookies.txt LOCALLY" to export cookies for `youtube.com` to a file named `cookies.txt`.
2.  **Encode to Base64:** Run this command in your terminal to convert the file to a single string:
    ```bash
    python -c "import base64; print(base64.b64encode(open('cookies.txt','rb').read()).decode())"
    ```
3.  **Add to Env:** Paste the resulting long string into `YTDLP_COOKIES_BASE64` in your `.env.local`.

---

## 🖥 Local Development

Since this project uses Python serverless functions, you must use the Vercel CLI to run it locally (standard `npm run dev` won't work for the API).

1.  **Install Vercel CLI:**
    ```bash
    npm i -g vercel
    ```
2.  **Run Development Server:**
    ```bash
    vercel dev
    ```
3.  Visit `http://localhost:3000`.

---

## 🚢 Deployment

1.  **Push to GitHub:** Create a repo and push your code.
2.  **Deploy on Vercel:**
    -   Import your GitHub repo in Vercel.
    -   **Important:** Go to **Settings** $\rightarrow$ **Environment Variables** and add all the keys from your `.env.local` (including the massive `YTDLP_COOKIES_BASE64`).
    -   Deploy!

---

## 🕹 How to Use

1.  Go to `/admin` and log in with your `ADMIN_PASSWORD`.
2.  **Option A (YouTube):** Paste the URL of the latest MoonDAO Town Hall.
3.  **Option B (Manual):** If you have a text transcript, paste it directly.
4.  Click **Generate Summary**.
5.  **Review:** Read the generated summary.
    -   *Edit:* Type directly in the text box to fix errors.
    -   *Regenerate:* Type a prompt (e.g., "Focus more on the NFT proposal") and click "Regenerate".
6.  Click **Send to Everyone** to broadcast the email via Kit.
