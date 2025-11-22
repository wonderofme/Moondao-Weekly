import json
import os
import traceback

import google.generativeai as genai
from http.server import BaseHTTPRequestHandler


ADMIN_PASS = os.environ.get("ADMIN_PASSWORD")
GEMINI_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_MODEL_NAME = os.environ.get("GEMINI_MODEL_NAME")


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
    if not GEMINI_MODEL:
      respond(
        self,
        500,
        {"error": "Gemini API is not configured."},
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

    original_transcript = data.get("original_transcript")
    user_prompt = data.get("user_prompt")
    current_summary = data.get("current_summary", "")

    if not original_transcript or not isinstance(original_transcript, str):
      respond(self, 400, {"error": "original_transcript is required."})
      return

    if not user_prompt or not isinstance(user_prompt, str) or not user_prompt.strip():
      respond(self, 400, {"error": "user_prompt is required."})
      return

    try:
      # Build regeneration prompt
      regeneration_prompt = f"""
You are a professional summarizer for a space DAO.
You previously created this summary:

{current_summary}

The user now wants you to modify it with this instruction: {user_prompt.strip()}

Based on the original transcript below, regenerate the summary according to the user's request.
Maintain the markdown formatting and focus on:
1. Urgent deadlines and action items.
2. New proposals (names, goals, status).
3. Key project updates from Senators.
4. Guest speakers or upcoming events.

Original transcript:
{original_transcript}
"""

      response = GEMINI_MODEL.generate_content(regeneration_prompt)
      if not response.text:
        raise RuntimeError("Gemini did not return any content.")

      regenerated_summary = response.text

      respond(
        self,
        200,
        {"status": "Success", "summary": regenerated_summary},
      )
    except Exception as error:
      traceback.print_exc()
      respond(self, 500, {"error": str(error)})

