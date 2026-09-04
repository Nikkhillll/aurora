import os
from dotenv import load_dotenv

load_dotenv()

VERSION = "1.0.0"

# Comma-separated exact origins, plus a regex that covers every Vercel preview URL.
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    if o.strip()
]
ALLOWED_ORIGIN_REGEX = r"https://.*\.vercel\.app"

GATEWAY_KEY = os.getenv("GATEWAY_KEY", "aurora-dev-key")
REQUIRE_AUTH = os.getenv("REQUIRE_AUTH", "false").lower() == "true"
PORT = int(os.getenv("PORT", "8000"))
