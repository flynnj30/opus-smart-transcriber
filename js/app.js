(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const fileInput = $("fileInput");
  const dropzone = $("dropzone");
  const chooseBtn = $("chooseBtn");
  const removeBtn = $("removeBtn");
  const fileRow = $("fileRow");
  const fileName = $("fileName");
  const fileMeta = $("fileMeta");
  const transcribeBtn = $("transcribeBtn");
  const language = $("language");
  const progressWrap = $("progressWrap");
  const progressBar = $("progressBar");
  const progressLabel = $("progressLabel");
  const progressPercent = $("progressPercent");
  const notice = $("notice");
  const resultCard = $("resultCard");
  const transcript = $("transcript");
  const copyBtn = $("copyBtn");
  const downloadBtn = $("downloadBtn");
  const engineStatus = $("engineStatus");

  let selectedFile = null;

  function setProgress(pct, label) {
    progressWrap.classList.remove("hidden");
    progressBar.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    progressPercent.textContent = `${Math.round(pct)}%`;
    progressLabel.textContent = label;
  }

  function selectFile(file) {
    if (!file) return;
    selectedFile = file;
    fileName.textContent = file.name;
    fileMeta.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    fileRow.classList.remove("hidden");
    transcribeBtn.disabled = false;
    resultCard.classList.add("hidden");
    notice.textContent = "";
  }

  function reset() {
    selectedFile = null;
    fileInput.value = "";
    fileRow.classList.add("hidden");
    transcribeBtn.disabled = true;
    resultCard.classList.add("hidden");
    transcript.value = "";
    progressWrap.classList.add("hidden");
    notice.textContent = "";
  }

  engineStatus.textContent = SmartOpusTranscriber.supported()
    ? "Browser recognition available"
    : "Browser recognition unavailable";

  chooseBtn.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    fileInput.click();
  });
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") fileInput.click();
  });
  fileInput.addEventListener("change", () => selectFile(fileInput.files[0]));
  removeBtn.addEventListener("click", reset);

  ["dragenter", "dragover"].forEach(type => dropzone.addEventListener(type, e => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  }));
  ["dragleave", "drop"].forEach(type => dropzone.addEventListener(type, e => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
  }));
  dropzone.addEventListener("drop", e => selectFile(e.dataTransfer.files[0]));

  transcribeBtn.addEventListener("click", async () => {
    if (!selectedFile) return;
    transcribeBtn.disabled = true;
    notice.textContent = "";
    resultCard.classList.add("hidden");

    try {
      const text = await SmartOpusTranscriber.transcribe(selectedFile, {
        language: language.value,
        onProgress: setProgress,
        onInterim: (finalText, interim) => {
          transcript.value = [finalText, interim].filter(Boolean).join(" ");
          resultCard.classList.remove("hidden");
        }
      });
      transcript.value = text || "No speech was recognized.";
      resultCard.classList.remove("hidden");
    } catch (error) {
      notice.textContent = error?.message || String(error);
    } finally {
      transcribeBtn.disabled = false;
    }
  });

  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(transcript.value);
    copyBtn.textContent = "Copied";
    setTimeout(() => copyBtn.textContent = "Copy", 1200);
  });

  downloadBtn.addEventListener("click", () => {
    const blob = new Blob([transcript.value], { type: "text/plain;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedFile?.name?.replace(/\.[^.]+$/, "") || "transcript"}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
})();
