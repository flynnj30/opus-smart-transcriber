/* ScriptFlow Pro integration adapter.
 *
 * Add:
 * <script src="js/smart-opus-transcriber.js"></script>
 *
 * Then:
 * const text = await SmartOpusTranscriber.transcribe(file, {
 *   language: "en-US",
 *   onProgress: (percent, label) => { ... }
 * });
 *
 * No /transcribe endpoint is used.
 */
window.ScriptFlowTranscriptAdapter = {
  async transcribe(file, options = {}) {
    return window.SmartOpusTranscriber.transcribe(file, options);
  }
};
