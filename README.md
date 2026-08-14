# Smart OPUS Transcriber — standalone

This folder is intentionally separate from the existing ScriptFlow Pro backend.

## What it does

- Browser-based audio-file transcription workflow.
- No Gemini.
- No Puter.
- No Hugging Face Hub.
- No FastAPI.
- No Render `/transcribe` dependency.
- No API key.
- Drag/drop upload.
- OPUS/OGG/WebM and common browser audio files.
- Progress UI.
- Copy/download transcript.
- `ScriptFlowTranscriptAdapter` for integrating the engine into Transcript Studio.

## Important accuracy/compatibility note

There is no deterministic, rule-only algorithm that converts arbitrary human speech into accurate words. Speech recognition necessarily uses a recognition engine.

This implementation uses the browser's Web Speech recognition capability and requests on-device processing where the browser exposes it. Browser support is limited and varies by browser/version. MDN documents `SpeechRecognition` as limited availability, and notes that browser implementations may use a server recognition service unless on-device processing is explicitly available.

For production-grade, private, offline transcription of uploaded OPUS files across browsers, a local WASM speech-recognition model is required. That would still be a speech-recognition model, but it would not be Gemini, an LLM, Hugging Face, or a cloud API.

## Running

Use HTTPS or localhost. Some speech APIs require a secure context.

A simple local server:

    python -m http.server 8080

Then open:

    http://localhost:8080/

## ScriptFlow Pro integration

Copy:

    js/smart-opus-transcriber.js

into your existing `js/` folder and include it before your Transcript Studio integration code.

Then:

    const text = await SmartOpusTranscriber.transcribe(file, {
      language: "en-US",
      onProgress(percent, label) {}
    });

Do not call the old Render `/transcribe` endpoint.

## Why the old architecture was removed

The old workflow downloaded a speech model through Hugging Face and depended on FastAPI/Render. That caused the HF unauthenticated warning and could produce 502 responses when the service/model was unavailable.

This standalone module deliberately has no such network dependency.
