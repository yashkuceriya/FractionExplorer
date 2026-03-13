export async function POST(req: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return new Response(null, { status: 501 }); // Signal: no ElevenLabs, use Web Speech
  }

  let text: string;
  let voiceId: string;
  try {
    const body = await req.json();
    text = body.text;
    voiceId = body.voiceId;
  } catch {
    return new Response("Invalid body", { status: 400 });
  }

  if (!text || !voiceId) {
    return new Response("Missing text or voiceId", { status: 400 });
  }

  // Validate voiceId format — must be alphanumeric (ElevenLabs IDs)
  if (!/^[a-zA-Z0-9]{10,30}$/.test(voiceId)) {
    return new Response("Invalid voiceId format", { status: 400 });
  }

  // Cost guard: reject text over 500 chars
  if (text.length > 500) {
    return new Response("Text too long", { status: 413 });
  }

  // Clean text server-side to save ElevenLabs characters
  const { cleanForSpeech } = await import("@/lib/tts-utils");
  const cleanText = cleanForSpeech(text);
  if (!cleanText) {
    return new Response("Empty after cleaning", { status: 400 });
  }

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: "eleven_flash_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text().catch(() => "Unknown error");
      console.error("ElevenLabs error:", response.status, errText);
      return new Response("TTS error", { status: 502 });
    }

    // Stream the audio through
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    console.error("ElevenLabs fetch error:", err);
    return new Response("TTS error", { status: 502 });
  }
}
