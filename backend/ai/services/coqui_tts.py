# ai/services/coqui_tts.py
import logging
import os
import uuid
import requests

logger    = logging.getLogger(__name__)
COQUI_URL = os.environ.get("COQUI_TTS_URL", "http://socialmedia-coqui:5002")


def is_available() -> bool:
    """Truth check: TTS.available == True"""
    try:
        res = requests.get(f"{COQUI_URL}/", timeout=5)
        return res.status_code in (200, 405)  # 405 = method not allowed but server is up
    except Exception:
        return False


def generate_audio(text: str, message_id: int) -> str:
    """
    Synthesize text → wav file → return media URL.
    Raises RuntimeError if Coqui is down.
    """
    from django.conf import settings

    if not is_available():
        raise RuntimeError("Coqui TTS is not available")

    response = requests.get(
        f"{COQUI_URL}/api/tts",
        params={"text": text},
        timeout=30,
    )
    response.raise_for_status()

    audio_dir = os.path.join(settings.MEDIA_ROOT, "audio")
    os.makedirs(audio_dir, exist_ok=True)

    filename = f"msg_{message_id}_{uuid.uuid4().hex[:8]}.wav"
    filepath = os.path.join(audio_dir, filename)

    with open(filepath, "wb") as f:
        f.write(response.content)

    audio_url = f"{settings.MEDIA_URL}audio/{filename}"
    logger.info(f"Coqui TTS saved: {filepath}")
    return audio_url