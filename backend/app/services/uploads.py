from __future__ import annotations

import mimetypes
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile, status


ALLOWED_MIME_TYPES: set[str] = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.oasis.opendocument.spreadsheet",
    "application/vnd.oasis.opendocument.presentation",
    "text/csv",
    "text/plain",
    "application/zip",
    "application/octet-stream",
}

ALLOWED_EXTENSIONS: set[str] = {
    ".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg",
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    ".odt", ".ods", ".odp", ".csv", ".txt", ".zip",
}


def _ext_from_filename(filename: str | None) -> str:
    if not filename:
        return ""
    return Path(filename).suffix.lower()


def save_upload(file: UploadFile, storage_dir: Path) -> tuple[str, str, str]:
    """Validate the upload, write it to disk, return (stored_name, original_name, public_url).

    Validation accepts the MIME type or the file extension. Files are stored with
    a uuid stem to avoid collisions; the original extension is preserved so the
    serve endpoint can pick the right MIME.
    """
    ext = _ext_from_filename(file.filename)
    mime = (file.content_type or "").lower()

    mime_ok = mime in ALLOWED_MIME_TYPES
    ext_ok = ext in ALLOWED_EXTENSIONS
    if not mime_ok and not ext_ok:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Nieobsługiwany format pliku. Dozwolone: PDF, obrazy "
                "(PNG/JPG/GIF/WEBP/SVG), dokumenty Office (DOC/DOCX/XLS/XLSX/PPT/PPTX), "
                "OpenDocument, CSV, TXT, ZIP."
            ),
        )

    if not ext:
        guessed = mimetypes.guess_extension(mime) or ".bin"
        ext = guessed.lower()

    storage_dir.mkdir(parents=True, exist_ok=True)
    stored_name = f"{uuid.uuid4()}{ext}"
    file_path = storage_dir / stored_name
    file_path.write_bytes(file.file.read())

    original_name = file.filename or f"dokument{ext}"
    public_url = f"/storage/documents/{stored_name}"
    return stored_name, original_name, public_url


def guess_media_type(file_path: Path) -> str:
    mime, _ = mimetypes.guess_type(str(file_path))
    return mime or "application/octet-stream"
