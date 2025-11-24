import base64
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler
import json
import os
import tempfile
import time
import traceback

import google.generativeai as genai
import requests
from yt_dlp import YoutubeDL
from markdown import markdown


ADMIN_PASS = os.environ.get("ADMIN_PASSWORD")
ASSEMBLY_KEY = os.environ.get("ASSEMBLYAI_API_KEY")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL_NAME = os.environ.get("GEMINI_MODEL_NAME")
KIT_API_SECRET = os.environ.get("KIT_API_SECRET")
KIT_EMAIL_TEMPLATE_ID = os.environ.get("KIT_EMAIL_TEMPLATE_ID")
KIT_FORM_ID = os.environ.get("KIT_FORM_ID")
YTDLP_COOKIES = os.environ.get("YTDLP_COOKIES")
YTDLP_COOKIES_BASE64 = os.environ.get("YTDLP_COOKIES_BASE64")


AVAILABLE_GEMINI_NAMES = [
  name
  for name in [
    GEMINI_MODEL_NAME,
    "models/gemini-2.5-flash",
    "models/gemini-flash-latest",
    "models/gemini-2.5-flash-preview-05-20",
    "models/gemini-2.0-flash-001",
    "models/gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-flash-latest",
    "gemini-2.0-flash-001",
  ]
  if name
]


def _create_gemini_model():
  if not GEMINI_KEY:
    return None

  genai.configure(api_key=GEMINI_KEY)

  for candidate in AVAILABLE_GEMINI_NAMES:
    try:
      return genai.GenerativeModel(candidate)
    except Exception:
      continue
  return None


GEMINI_MODEL = _create_gemini_model()


def respond(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
  body = json.dumps(payload).encode()
  handler.send_response(status)
  handler.send_header("Content-Type", "application/json")
  handler.send_header("Content-Length", str(len(body)))
  handler.end_headers()
  handler.wfile.write(body)


def stream_file(path: str, chunk_size: int = 5_242_880):
  with open(path, "rb") as file_handle:
    while True:
      data = file_handle.read(chunk_size)
      if not data:
        break
      yield data


class handler(BaseHTTPRequestHandler):
  def log_message(self, format: str, *args) -> None:  # noqa: A003
    return

  def do_OPTIONS(self):
    self.send_response(200)
    self.send_header("Access-Control-Allow-Origin", "*")
    self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
    self.send_header("Access-Control-Allow-Headers", "Content-Type")
    self.end_headers()

  def do_POST(self):  # noqa: N802
    if not all([ADMIN_PASS, GEMINI_MODEL, KIT_API_SECRET]):
      respond(
        self,
        500,
        {
          "error": (
            "Server configuration incomplete. "
            "Check Gemini, AssemblyAI, Kit, and admin credentials."
          )
        },
      )
      return

    try:
      content_length = int(self.headers.get("Content-Length", "0"))
      raw_body = self.rfile.read(content_length) if content_length else b"{}"
      data = json.loads(raw_body.decode("utf-8"))
    except Exception:
      respond(self, 400, {"error": "Invalid JSON payload."})
      return

    if data.get("password") != ADMIN_PASS:
      respond(self, 401, {"error": "Unauthorized"})
      return

    manual_transcript = data.get("manual_transcript")
    if isinstance(manual_transcript, str):
      manual_transcript = manual_transcript.strip() or None
    else:
      manual_transcript = None

    youtube_url = data.get("youtube_url")
    if not manual_transcript:
      if not youtube_url or not isinstance(youtube_url, str) or not youtube_url.strip():
        respond(self, 400, {"error": "Provide a YouTube URL or a manual transcript."})
      return
      youtube_url = youtube_url.strip()
    elif isinstance(youtube_url, str):
      youtube_url = youtube_url.strip()

    temp_dir = tempfile.gettempdir()
    audio_path = None

    cookie_path = None

    try:
      if manual_transcript:
        transcript_text = manual_transcript
      else:
        if not ASSEMBLY_KEY:
          raise RuntimeError("AssemblyAI API key is required for automatic transcription.")

      ydl_opts = {
          "format": "bestaudio/best",
          "outtmpl": os.path.join(temp_dir, "moondao-townhall.%(ext)s"),
          "noplaylist": True,
          "quiet": True,
          "no_warnings": True,
      }
      if YTDLP_COOKIES_BASE64 or YTDLP_COOKIES:
        cookie_path = os.path.join(temp_dir, "yt_cookies.txt")
        try:
          if YTDLP_COOKIES_BASE64:
            decoded = base64.b64decode(YTDLP_COOKIES_BASE64).decode("utf-8")
            cookies_content = decoded
          else:
            cookies_content = YTDLP_COOKIES

          with open(cookie_path, "w", encoding="utf-8") as cookie_file:
            cookie_file.write(cookies_content)

          ydl_opts["cookiefile"] = cookie_path
        except Exception as error:
          raise RuntimeError("Failed to load YouTube cookies") from error

      with YoutubeDL(ydl_opts) as ydl:
          download_info = ydl.extract_info(youtube_url, download=True)
          if not download_info:
            raise RuntimeError("Unable to download audio from YouTube.")
          if "requested_downloads" in download_info and download_info["requested_downloads"]:
            audio_path = download_info["requested_downloads"][0].get("filepath")
          else:
            audio_path = ydl.prepare_filename(download_info)
          if not audio_path or not os.path.exists(audio_path):
            raise RuntimeError("Downloaded audio file not found.")

      headers = {"authorization": ASSEMBLY_KEY}
      upload_response = requests.post(
        "https://api.assemblyai.com/v2/upload",
        headers=headers,
        data=stream_file(audio_path),
      )
      upload_response.raise_for_status()
      upload_url = upload_response.json()["upload_url"]

      transcript_response = requests.post(
        "https://api.assemblyai.com/v2/transcript",
        json={"audio_url": upload_url},
        headers=headers,
      )
      transcript_response.raise_for_status()
      transcript_id = transcript_response.json()["id"]

      transcript_text = self._poll_transcription(transcript_id, headers)

      summary = self._summarize_transcript(transcript_text)

      # Check if preview mode is requested
      preview_mode = data.get("preview", False)
      
      if preview_mode:
        # Return summary and transcript without sending email
        respond(
          self,
          200,
          {
            "status": "Success",
            "summary": summary,
            "transcript": transcript_text,
          },
        )
      else:
        # Send email immediately (backward compatibility)
      self._send_email(summary)
      respond(
        self,
        200,
        {"status": "Success", "summary": summary},
      )
    except Exception as error:
      traceback.print_exc()
      respond(self, 500, {"error": str(error)})
    finally:
      if audio_path and os.path.exists(audio_path):
        try:
          os.remove(audio_path)
        except OSError:
          pass
      if cookie_path and os.path.exists(cookie_path):
        try:
          os.remove(cookie_path)
        except OSError:
          pass

  def _poll_transcription(self, transcript_id: str, headers: dict, timeout: int = 900):
    started_at = time.time()
    while True:
      status_response = requests.get(
        f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
        headers=headers,
      )
      status_response.raise_for_status()
      payload = status_response.json()
      status = payload.get("status")

      if status == "completed":
        return payload.get("text", "")
      if status == "failed":
        raise RuntimeError("Transcription failed.")

      if time.time() - started_at > timeout:
        raise TimeoutError("Transcription timed out.")

      time.sleep(5)

  def _summarize_transcript(self, transcript_text: str) -> str:
    prompt = """
You are a professional summarizer for a space DAO.
Create a clean, markdown-formatted summary of the MoonDAO Town Hall transcript focusing on:
1. Urgent deadlines and action items.
2. New proposals (names, goals, status).
3. Key project updates from Senators.
4. Guest speakers or upcoming events.
Keep it concise, use bullet points where appropriate, and include section headings.
"""

    response = GEMINI_MODEL.generate_content([prompt, transcript_text])
    if not response.text:
      raise RuntimeError("Gemini did not return any content.")
    return response.text

  def _send_email(self, summary: str) -> None:
    if not KIT_API_SECRET:
      raise RuntimeError("KIT_API_SECRET environment variable is not set.")
    if not KIT_FORM_ID:
      raise RuntimeError(
        "KIT_FORM_ID environment variable is not set. Broadcast needs a target form.",
      )

    try:
      form_id_value = int(KIT_FORM_ID)
    except ValueError as error:
      raise RuntimeError("KIT_FORM_ID must be numeric.") from error

    html_body = markdown(
      summary,
      extensions=["extra", "sane_lists"],
      output_format="html5",
    )

    html_summary = (
      "<html><body style='font-family:Inter,Arial,sans-serif; color:#111827;'>"
      "<h2 style='margin-top:0;'>MoonDAO Town Hall Summary</h2>"
      f"{html_body}"
      "</body></html>"
    )

    payload = {
      "api_secret": KIT_API_SECRET,
      "subject": "🚀 MoonDAO Weekly Recap",
      "content": html_summary,
      "public": True,
      "send_to_form_ids": [form_id_value],
      "send_at": datetime.now(timezone.utc).isoformat(),
    }

    if KIT_EMAIL_TEMPLATE_ID:
      try:
        payload["email_layout_template_id"] = int(KIT_EMAIL_TEMPLATE_ID)
      except ValueError as error:
        raise RuntimeError("KIT_EMAIL_TEMPLATE_ID must be numeric.") from error

    response = requests.post(
      "https://api.convertkit.com/v3/broadcasts",
      json=payload,
      timeout=60,
    )

    if response.status_code not in (200, 201):
      try:
        error_payload = response.json()
      except ValueError:
        error_payload = {"error": response.text}
      raise RuntimeError(f"Kit broadcast failed: {error_payload}")

    # ConvertKit automatically sends the broadcast when send_at is <= now.


