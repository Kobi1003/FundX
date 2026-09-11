"""
Local on-disk file storage for hackathon / local testing.

Files land under the repo `uploads/` tree (bind-mounted in Docker).
This is intentionally NOT Supabase Storage — keep demos offline-friendly.
"""

from __future__ import annotations

import os
import re
import uuid
from pathlib import Path
from typing import Any

# Prefer explicit env; Docker mounts ./uploads → /app/uploads
_DEFAULT_ROOT = Path(os.getenv("UPLOAD_ROOT", "/app/uploads"))
# When running outside Docker (e.g. local uvicorn), fall back to repo uploads/
if not _DEFAULT_ROOT.exists() and Path("uploads").exists():
    _DEFAULT_ROOT = Path("uploads").resolve()
elif not _DEFAULT_ROOT.exists():
    # Walk up from this file: backend/shared → repo root
    repo_uploads = Path(__file__).resolve().parents[2] / "uploads"
    _DEFAULT_ROOT = repo_uploads

UPLOAD_ROOT = _DEFAULT_ROOT
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".doc", ".docx", ".csv"}
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(5 * 1024 * 1024)))  # 5 MB


def _safe_name(filename: str) -> str:
    base = Path(filename).name
    base = re.sub(r"[^\w.\- ]+", "_", base).strip() or "document"
    return base[:180]


def ensure_dir(*parts: str) -> Path:
    path = UPLOAD_ROOT.joinpath(*parts)
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_bytes(
    *,
    category: str,
    owner_id: str,
    filename: str,
    content: bytes,
    subfolder: str | None = None,
) -> dict[str, Any]:
    if len(content) > MAX_UPLOAD_BYTES:
        raise ValueError(f"File exceeds max size of {MAX_UPLOAD_BYTES} bytes")

    safe = _safe_name(filename)
    ext = Path(safe).suffix.lower()
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type '{ext}'. Allowed: {sorted(ALLOWED_EXTENSIONS)}")

    parts = [category, owner_id]
    if subfolder:
        parts.append(subfolder)
    dest_dir = ensure_dir(*parts)
    unique = f"{uuid.uuid4().hex[:8]}_{safe}"
    dest = dest_dir / unique
    dest.write_bytes(content)

    # Path relative to UPLOAD_ROOT — portable across host/container
    rel = dest.relative_to(UPLOAD_ROOT).as_posix()
    return {
        "filename": safe,
        "stored_name": unique,
        "storage_path": rel,
        "absolute_path": str(dest),
        "size_bytes": len(content),
        "content_type_guess": ext.lstrip(".") or "bin",
    }


def resolve_path(storage_path: str) -> Path:
    """Resolve a relative storage_path under UPLOAD_ROOT (no path traversal)."""
    root = UPLOAD_ROOT.resolve()
    candidate = (UPLOAD_ROOT / storage_path).resolve()
    if not str(candidate).startswith(str(root)):
        raise ValueError("Invalid storage path")
    return candidate


def read_text_excerpt(storage_path: str | None, *, max_chars: int = 4000) -> str:
    """Best-effort text extraction for AI prompts (txt/md/pdf)."""
    if not storage_path:
        return ""
    try:
        path = resolve_path(storage_path)
    except ValueError:
        return ""
    if not path.exists() or not path.is_file():
        return ""

    suffix = path.suffix.lower()
    if suffix in {".txt", ".md", ".csv"}:
        text = path.read_text(encoding="utf-8", errors="ignore")
        return text[:max_chars].strip()

    if suffix == ".pdf":
        try:
            from pypdf import PdfReader  # optional

            reader = PdfReader(str(path))
            chunks: list[str] = []
            for page in reader.pages[:8]:
                chunks.append(page.extract_text() or "")
                if sum(len(c) for c in chunks) >= max_chars:
                    break
            return "\n".join(chunks)[:max_chars].strip()
        except Exception:
            return f"[PDF stored at {storage_path}; text extraction unavailable]"

    return f"[Binary document stored at {storage_path}]"


def list_owner_files(category: str, owner_id: str) -> list[dict[str, Any]]:
    folder = UPLOAD_ROOT / category / owner_id
    if not folder.exists():
        return []
    out: list[dict[str, Any]] = []
    for path in sorted(folder.rglob("*")):
        if path.is_file():
            rel = path.relative_to(UPLOAD_ROOT).as_posix()
            out.append(
                {
                    "filename": path.name,
                    "storage_path": rel,
                    "size_bytes": path.stat().st_size,
                }
            )
    return out
