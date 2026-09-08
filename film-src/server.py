#!/usr/bin/env python3
"""Приёмник кадров для render.html: GET — статика этой папки, POST /frame?i=N — пишет PNG."""
import os, sys, json
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse, parse_qs

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8130
OUT = os.environ.get("FILM_OUT", "/private/tmp/claude-501/-Users-roy/174dced4-c26b-436a-96c4-d43b9c875482/scratchpad/film-frames")
os.makedirs(OUT, exist_ok=True)

class H(SimpleHTTPRequestHandler):
    def log_message(self, *a):  # тише
        pass
    def do_GET(self):
        if urlparse(self.path).path == "/status":
            n = len([f for f in os.listdir(OUT) if f.endswith(".png")])
            body = json.dumps({"frames": n, "out": OUT}).encode()
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body); return
        return super().do_GET()
    def do_POST(self):
        u = urlparse(self.path); ln = int(self.headers.get("Content-Length", 0)); data = self.rfile.read(ln)
        if u.path == "/frame":
            i = int(parse_qs(u.query).get("i", ["0"])[0])
            with open(os.path.join(OUT, f"f_{i:04d}.png"), "wb") as f: f.write(data)
            print(f"frame {i} ({len(data)} b)", flush=True)
        elif u.path == "/done":
            print("DONE", flush=True)
        self.send_response(204); self.end_headers()

print(f"film receiver :{PORT} → {OUT}", flush=True)
ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()
