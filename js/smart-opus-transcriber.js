/* Smart OPUS Transcriber
 * No FastAPI, Gemini, Puter, Hugging Face, API key, or cloud transcription endpoint.
 *
 * Important: browser speech recognition is not guaranteed to be offline.
 * Where supported, this module requests on-device recognition. Browser support varies.
 */
(function (global) {
  "use strict";

  const SpeechRecognition = global.SpeechRecognition || global.webkitSpeechRecognition;

  function cleanText(text) {
    return String(text || "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.!?;:])/g, "$1")
      .replace(/([,.!?;:])([A-Za-z])/g, "$1 $2")
      .trim();
  }

  function supported() {
    return !!SpeechRecognition;
  }

  async function transcribe(file, options = {}) {
    if (!file) throw new Error("No audio file was supplied.");
    if (!supported()) {
      throw new Error(
        "This browser does not expose SpeechRecognition. Use a Chromium browser with on-device speech recognition available, or connect your existing local speech engine."
      );
    }

    const language = options.language || "en-US";
    const onProgress = typeof options.onProgress === "function" ? options.onProgress : () => {};
    const onInterim = typeof options.onInterim === "function" ? options.onInterim : () => {};

    // The browser API can recognize an AudioTrack in supporting implementations.
    // We play the selected file through an AudioContext destination and pass its track.
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = url;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";

    const ctx = new (global.AudioContext || global.webkitAudioContext)();
    const source = ctx.createMediaElementSource(audio);
    const destination = ctx.createMediaStreamDestination();
    source.connect(destination);

    // Keep playback silent for the user while still feeding the recognition track.
    const mute = ctx.createGain();
    mute.gain.value = 0;
    source.connect(mute);
    mute.connect(ctx.destination);

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalText = "";
    let ended = false;
    let lastProgress = 0;

    const resultPromise = new Promise((resolve, reject) => {
      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) finalText += " " + text;
          else interim += text;
        }
        const cleaned = cleanText(finalText);
        onInterim(cleaned, cleanText(interim));
      };

      recognition.onerror = (event) => {
        if (event.error === "no-speech") return;
        reject(new Error("Browser speech recognition error: " + event.error));
      };

      recognition.onend = () => {
        if (!ended) {
          ended = true;
          resolve(cleanText(finalText));
        }
      };
    });

    try {
      onProgress(8, "Preparing audio…");
      await ctx.resume();

      onProgress(18, "Starting local browser recognition…");

      // Prefer on-device recognition where the browser implements it.
      if ("processLocally" in recognition) {
        recognition.processLocally = true;
      }

      // start(MediaStreamTrack) is supported only in browsers that implement
      // recognition of an audio track. It is intentionally feature-detected.
      let startedWithTrack = false;
      try {
        recognition.start(destination.stream.getAudioTracks()[0]);
        startedWithTrack = true;
      } catch (_) {}

      if (!startedWithTrack) {
        recognition.start();
      }

      onProgress(28, "Transcribing…");
      await audio.play();

      const duration = await new Promise((resolve) => {
        if (Number.isFinite(audio.duration) && audio.duration > 0) return resolve(audio.duration);
        audio.addEventListener("loadedmetadata", () => resolve(audio.duration || 1), { once: true });
      });

      const timer = setInterval(() => {
        if (audio.ended) {
          clearInterval(timer);
          onProgress(96, "Finalizing transcript…");
        } else {
          const pct = Math.min(94, 28 + Math.floor((audio.currentTime / Math.max(duration, 1)) * 66));
          if (pct > lastProgress) {
            lastProgress = pct;
            onProgress(pct, "Transcribing…");
          }
        }
      }, 250);

      const text = await resultPromise;
      clearInterval(timer);
      onProgress(100, "Complete");
      return text;
    } finally {
      ended = true;
      try { recognition.stop(); } catch (_) {}
      audio.pause();
      source.disconnect();
      mute.disconnect();
      destination.disconnect();
      await ctx.close();
      URL.revokeObjectURL(url);
    }
  }

  global.SmartOpusTranscriber = {
    supported,
    cleanText,
    transcribe
  };
})(window);
