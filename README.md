# Video Recap Generator

An AI-powered web application that automatically transcribes YouTube videos and generates intelligent summaries. Built with Next.js, Python serverless functions, and integrated with Google Gemini AI and AssemblyAI.

## Features

- **YouTube Video Processing**: Automatically downloads and transcribes YouTube videos using yt-dlp and AssemblyAI
- **AI-Powered Summarization**: Uses Google Gemini AI to generate concise, well-formatted summaries
- **Interactive Admin Panel**: Preview, edit, and regenerate summaries before sending
- **Email Broadcasting**: Send summaries to subscribers via ConvertKit integration
- **Manual Transcript Support**: Option to paste transcripts directly for summarization
- **Modern UI**: Clean, responsive design with a modern tech aesthetic

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **Tailwind CSS 4** - Utility-first CSS framework

### Backend
- **Python Serverless Functions** - Vercel serverless functions
- **yt-dlp** - YouTube video/audio downloader
- **AssemblyAI** - Audio transcription service
- **Google Gemini AI** - AI summarization
- **ConvertKit API** - Email subscription and broadcasting

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│  (Frontend UI)  │
└────────┬────────┘
         │
         ├─── /api/subscribe ───> ConvertKit API
         │
         └─── /api/summarize ───> Python Serverless
                  │
                  ├─── yt-dlp ───> Download YouTube audio
                  ├─── AssemblyAI ───> Transcribe audio
                  └─── Gemini AI ───> Generate summary
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+ (for local development)
- API keys for:
  - Google Gemini AI
  - AssemblyAI
  - ConvertKit (optional, for email features)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd video-recap-generator
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp env.example .env.local
```

4. Add your API keys to `.env.local`:
```env
GEMINI_API_KEY=your_gemini_key_here
ASSEMBLYAI_API_KEY=your_assemblyai_key_here
ADMIN_PASSWORD=your_secure_password_here

# Optional: For email features
KIT_API_SECRET=your_kit_api_secret_here
KIT_FORM_ID=your_kit_form_id_here

# Optional: For YouTube videos that require authentication
YTDLP_COOKIES_BASE64=your_base64_encoded_cookies
```

### Local Development

1. Run the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000)

3. Access the admin panel at [http://localhost:3000/admin](http://localhost:3000/admin)

### YouTube Cookie Setup (Optional)

For videos that require authentication or are age-restricted:

1. Export cookies from your browser:
```bash
yt-dlp --cookies-from-browser chrome --cookies cookies.txt https://youtube.com
```

2. Base64 encode the cookies file:
```bash
python -c "import base64; print(base64.b64encode(open('cookies.txt','rb').read()).decode())"
```

3. Add the encoded string to `YTDLP_COOKIES_BASE64` in your `.env.local`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key for AI summarization |
| `ASSEMBLYAI_API_KEY` | Yes | AssemblyAI API key for transcription |
| `ADMIN_PASSWORD` | Yes | Password for admin panel access |
| `KIT_API_SECRET` | No | ConvertKit API secret for email features |
| `KIT_FORM_ID` | No | ConvertKit form ID for subscriptions |
| `KIT_EMAIL_TEMPLATE_ID` | No | ConvertKit email template ID |
| `GEMINI_MODEL_NAME` | No | Override default Gemini model |
| `YTDLP_COOKIES_BASE64` | No | Base64-encoded YouTube cookies |

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

The Python serverless functions will be automatically detected and deployed.

### Manual Deployment

```bash
npm run build
vercel --prod
```

## Usage

### Admin Panel

1. Navigate to `/admin`
2. Enter your admin password
3. Choose one of two options:
   - **YouTube URL**: Paste a YouTube video URL
   - **Manual Transcript**: Paste a transcript directly
4. Click "Generate Summary" to create a preview
5. Review and edit the summary as needed
6. Use "Regenerate with Prompt" to modify the summary with AI
7. Click "Send to Everyone" to broadcast via email

### Public Page

Users can subscribe to receive video summaries via email through the main page.

## API Endpoints

### POST `/api/subscribe`
Subscribe an email address to receive summaries.

**Request:**
```json
{
  "email": "user@example.com"
}
```

### POST `/api/summarize`
Generate a summary from a YouTube URL or manual transcript.

**Request:**
```json
{
  "password": "admin_password",
  "youtube_url": "https://youtube.com/watch?v=...",
  "manual_transcript": "optional transcript text",
  "preview": true
}
```

**Response (preview mode):**
```json
{
  "status": "Success",
  "summary": "Generated summary...",
  "transcript": "Full transcript..."
}
```

### POST `/api/summarize/regenerate`
Regenerate a summary with custom instructions.

**Request:**
```json
{
  "password": "admin_password",
  "original_transcript": "Full transcript...",
  "current_summary": "Current summary...",
  "user_prompt": "Make it more concise"
}
```

### POST `/api/summarize/send`
Send a summary to all subscribers.

**Request:**
```json
{
  "password": "admin_password",
  "summary": "Final summary to send"
}
```

## Project Structure

```
video-recap-generator/
├── api/                    # Python serverless functions
│   └── summarize/
│       ├── index.py        # Main summarization endpoint
│       ├── regenerate/     # Summary regeneration
│       └── send/           # Email broadcasting
├── src/
│   └── app/
│       ├── admin/          # Admin panel
│       ├── api/            # Next.js API routes
│       └── page.js         # Public landing page
├── public/                 # Static assets
├── requirements.txt        # Python dependencies
├── package.json            # Node.js dependencies
└── vercel.json             # Vercel configuration
```

## License

This project is open source and available for portfolio use.

## Contributing

This is a portfolio project. Feel free to fork and modify for your own use.
