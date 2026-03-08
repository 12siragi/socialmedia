# ai/services/coqui_tts.py
import logging
import os
import uuid
import tempfile
import requests

logger    = logging.getLogger(__name__)
COQUI_URL = os.environ.get("COQUI_TTS_URL", "http://coqui-tts:5002")


def is_available() -> bool:
    """Truth check: TTS.available == True"""
    try:
        res = requests.get(f"{COQUI_URL}/", timeout=5)
        return res.status_code in (200, 405)
    except Exception:
        return False


def generate_audio(text: str, message_id: int) -> str:
    """
    1. Call Coqui TTS → get wav bytes
    2. Upload wav to Cloudinary → get public URL
    3. Return Cloudinary URL

    Raises on failure — caller handles retry.
    """
    import cloudinary
    import cloudinary.uploader

    if not is_available():
        raise RuntimeError("Coqui TTS is not available")

    # 1. Generate audio from Coqui
    response = requests.get(
        f"{COQUI_URL}/api/tts",
        params={"text": text},
        timeout=60,  # TTS can be slow for long text
    )
    response.raise_for_status()

    # 2. Save to temp file then upload to Cloudinary
    with tempfile.NamedTemporaryFile(
        suffix=".wav",
        prefix=f"msg_{message_id}_",
        delete=False
    ) as tmp:
        tmp.write(response.content)
        tmp_path = tmp.name

    try:
        result = cloudinary.uploader.upload(
            tmp_path,
            resource_type="video",   # Cloudinary uses "video" for audio files
            folder="chat_audio",
            public_id=f"msg_{message_id}_{uuid.uuid4().hex[:8]}",
            overwrite=False,
        )
        audio_url = result["secure_url"]
        logger.info(f"Coqui TTS uploaded to Cloudinary: {audio_url}")
        return audio_url

    finally:
        # Always clean up temp file
        try:
            os.unlink(tmp_path)
        except Exception:
            pass