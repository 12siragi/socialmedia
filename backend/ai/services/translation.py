import httpx
import logging
from django.core.cache import cache
from django.conf import settings

logger = logging.getLogger(__name__)

LIBRE_URL = getattr(settings, 'LIBRETRANSLATE_URL', 'http://libretranslate:5000')
SUPPORTED_LANGUAGES = {'en', 'ar'}
TRANSLATION_CACHE_TTL = 3600


def _cache_key(text, source, target):
    return f"translation:{source}:{target}:{hash(text[:100].strip().lower())}"


def translate(text, source_lang, target_lang):
    if not text or not text.strip():
        return text or ''
    if source_lang == target_lang:
        return text
    if target_lang not in SUPPORTED_LANGUAGES:
        return text
    key = _cache_key(text, source_lang, target_lang)
    cached = cache.get(key)
    if cached:
        return cached
    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.post(
                f"{LIBRE_URL}/translate",
                json={"q": text, "source": source_lang, "target": target_lang, "format": "text"},
            )
            if response.status_code == 200:
                translated = response.json().get('translatedText', text)
                cache.set(key, translated, TRANSLATION_CACHE_TTL)
                return translated
            return text
    except Exception as e:
        logger.error(f"Translation error: {e}")
        return text


def translate_message_for_receiver(content, sender_lang, receiver_lang):
    if not content:
        return content
    return translate(content, sender_lang, receiver_lang)