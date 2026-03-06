# ai/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status


class TranslateView(APIView):
    """
    POST /api/ai/translate/
    Body: { text, source_lang, target_lang }

    TRUTH GATES:
    text empty         = False → 400
    same language      = False → return original (no API call)
    LibreTranslate up  = True  → return translated
    LibreTranslate down= False → return original with warning
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text        = request.data.get('text', '').strip()
        source_lang = request.data.get('source_lang', 'en')
        target_lang = request.data.get('target_lang', 'ar')

        # GATE 1: text must exist
        if not text:
            return Response(
                {'error': 'text is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # GATE 2: same language → return original
        if source_lang == target_lang:
            return Response({'translated_text': text, 'same_language': True})

        # GATE 3: translate
        try:
            from ai.services.translation import translate
            translated = translate(text, source_lang, target_lang)
            return Response({
                'translated_text': translated,
                'source_lang': source_lang,
                'target_lang': target_lang,
                'same_language': False,
            })
        except Exception as e:
            # INVARIANT: never crash — return original as fallback
            return Response({
                'translated_text': text,
                'error': 'Translation service unavailable',
                'same_language': False,
            }, status=status.HTTP_200_OK)  # 200 so frontend still gets text