from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os

PORT = 8000
ROOT = Path(__file__).resolve().parent
os.chdir(ROOT)
print(f"Portfolio available at http://localhost:{PORT}")
print("Press Ctrl+C to stop the server.")
ThreadingHTTPServer(("", PORT), SimpleHTTPRequestHandler).serve_forever()
