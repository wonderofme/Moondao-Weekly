import json
import os
import traceback
from datetime import datetime, timezone

import requests
from http.server import BaseHTTPRequestHandler
from markdown import markdown


ADMIN_PASS = os.environ.get("ADMIN_PASSWORD")
KIT_API_SECRET = os.environ.get("KIT_API_SECRET")
KIT_EMAIL_TEMPLATE_ID = os.environ.get("KIT_EMAIL_TEMPLATE_ID")
KIT_FORM_ID = os.environ.get("KIT_FORM_ID")


def respond(handler: BaseHTTPRequestHandler, status: int, payload: dict) -> None:
  body = json.dumps(payload).encode()
  handler.send_response(status)
  handler.send_header("Content-Type", "application/json")
  handler.send_header("Content-Length", str(len(body)))
  handler.end_headers()
  handler.wfile.write(body)


def _send_email(summary: str) -> None:
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
    if not all([ADMIN_PASS, KIT_API_SECRET]):
      respond(
        self,
        500,
        {
          "error": (
            "Server configuration incomplete. "
            "Check Kit API credentials and admin password."
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

    summary = data.get("summary")
    if not summary or not isinstance(summary, str) or not summary.strip():
      respond(self, 400, {"error": "summary is required."})
      return

    try:
      _send_email(summary.strip())

      respond(
        self,
        200,
        {"status": "Success", "message": "Summary sent to subscribers."},
      )
    except Exception as error:
      traceback.print_exc()
      respond(self, 500, {"error": str(error)})

