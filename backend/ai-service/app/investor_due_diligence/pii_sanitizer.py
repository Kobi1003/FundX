"""
DPDP-oriented PII Redactor for Investor Verification Engine.
Redacts Aadhaar, PAN, personal phone numbers, and address-labelled lines before LLM / Search prompt construction.
Ensures temp files are cleaned up immediately after text extraction.
"""

from __future__ import annotations

import os
import re
import tempfile
from typing import Tuple


def redact_pii(text: str) -> Tuple[str, dict[str, int]]:
    """
    Redact Aadhaar, PAN, phone numbers, and personal address lines.
    Returns (sanitized_text, redaction_counts).
    """
    if not text:
        return "", {"aadhaar": 0, "pan": 0, "phone": 0, "address_lines": 0}

    redaction_counts = {
        "aadhaar": 0,
        "pan": 0,
        "phone": 0,
        "address_lines": 0,
    }

    sanitized = text

    # 1. Redact Aadhaar (12 digits, optional spaces/hyphens)
    aadhaar_pattern = r"\b[2-9]\d{3}[\s\-]?\d{4}[\s\-]?\d{4}\b"
    aadhaar_matches = list(re.finditer(aadhaar_pattern, sanitized))
    if aadhaar_matches:
        redaction_counts["aadhaar"] += len(aadhaar_matches)
        sanitized = re.sub(aadhaar_pattern, "[REDACTED_AADHAAR]", sanitized)

    # 2. Redact PAN (10 chars: 5 letters, 4 digits, 1 letter)
    pan_pattern = r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b"
    pan_matches = list(re.finditer(pan_pattern, sanitized))
    if pan_matches:
        redaction_counts["pan"] += len(pan_matches)
        sanitized = re.sub(pan_pattern, "[REDACTED_PAN]", sanitized)

    # 3. Redact Phone Numbers (+91 or 10-digit Indian numbers)
    phone_pattern = r"(?:\+?91[\s\-]?)?[6-9]\d{9}\b"
    phone_matches = list(re.finditer(phone_pattern, sanitized))
    if phone_matches:
        redaction_counts["phone"] += len(phone_matches)
        sanitized = re.sub(phone_pattern, "[REDACTED_PHONE]", sanitized)

    # 4. Redact Address lines
    lines = sanitized.split("\n")
    cleaned_lines = []
    address_keywords = ["residential address:", "permanent address:", "address:", "flat no", "house no", "street name", "pincode:"]
    for line in lines:
        lower_line = line.lower()
        if any(keyword in lower_line for keyword in address_keywords):
            cleaned_lines.append("[REDACTED_PERSONAL_ADDRESS_LINE]")
            redaction_counts["address_lines"] += 1
        else:
            cleaned_lines.append(line)

    sanitized_final = "\n".join(cleaned_lines)

    return sanitized_final, redaction_counts


def extract_and_sanitize_cv(cv_bytes: bytes | None, filename: str | None, raw_text: str | None = None) -> Tuple[str, dict[str, int]]:
    """
    Extract text from raw text or uploaded CV bytes (PDF/TXT), sanitize PII, and clean up temporary files.
    """
    extracted_text = raw_text or ""

    if cv_bytes and filename:
        ext = os.path.splitext(filename)[1].lower()
        # Create temp file
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(cv_bytes)
            tmp_path = tmp.name

        try:
            if ext == ".txt":
                with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                    extracted_text = f.read()
            elif ext == ".pdf":
                # Try reading pdf stream or pypdf/PyPDF2 if available
                extracted_text = _extract_text_from_pdf(tmp_path)
            else:
                with open(tmp_path, "r", encoding="utf-8", errors="ignore") as f:
                    extracted_text = f.read()
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)

    return redact_pii(extracted_text)


def _extract_text_from_pdf(pdf_path: str) -> str:
    """Read text from PDF using pypdf/PyPDF2 or fallback regex stream extraction."""
    text_chunks = []
    try:
        import pypdf
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_chunks.append(t)
        if text_chunks:
            return "\n".join(text_chunks)
    except ImportError:
        pass

    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(pdf_path)
        for page in reader.pages:
            t = page.extract_text()
            if t:
                text_chunks.append(t)
        if text_chunks:
            return "\n".join(text_chunks)
    except ImportError:
        pass

    # Fallback raw byte text extraction for basic PDF streams
    try:
        with open(pdf_path, "rb") as f:
            content = f.read().decode("latin-1", errors="ignore")
            matches = re.findall(r"\((.*?)\)\s*Tj", content)
            if matches:
                return " ".join(matches)
    except Exception:
        pass

    return "PDF Content uploaded (text extraction fallback)."
