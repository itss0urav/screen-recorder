let mediaRecorder;
let chunks = [];
let timerInterval;
let startTime;
let recordingTime = 0;
let isPaused = false;
let pauseTime = 0;

function blurScreen() {
  const container = document.querySelector(".container");
  container.classList.add("blurred");
}

function unblurScreen() {
  const container = document.querySelector(".container");
  container.classList.remove("blurred");
}

function startRecording() {
  const audioSourceSelect = document.getElementById("audioSourceSelect");
  const audioSource = audioSourceSelect.value;

  let audioStreamPromise;
  if (audioSource === "microphone") {
    audioStreamPromise = navigator.mediaDevices.getUserMedia({ audio: true });
  } else if (audioSource === "file") {
    const audioFileInput = document.getElementById("audioFileInput");
    const file = audioFileInput.files[0];
    const fileReader = new FileReader();
    audioStreamPromise = new Promise((resolve, reject) => {
      fileReader.onload = () => {
        const audioBuffer = fileReader.result;
        const audioContext = new AudioContext();
        audioContext.decodeAudioData(audioBuffer, resolve, reject);
      };
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  }

  const videoOptions = { video: true };
  const audioOptions = { audio: true };
  const mediaStreamPromises = [
    navigator.mediaDevices.getDisplayMedia(videoOptions),
  ];

  if (audioSource !== "none") {
    mediaStreamPromises.push(audioStreamPromise);
  }

  Promise.all(mediaStreamPromises)
    .then(function (streams) {
      const [videoStream, audioStream] = streams;
      const mixedStream = new MediaStream();

      if (audioStream) {
        const audioTracks = audioStream.getAudioTracks();
        audioTracks.forEach((track) => {
          mixedStream.addTrack(track);
        });
      }

      const videoTrack = videoStream.getVideoTracks()[0];
      mixedStream.addTrack(videoTrack);

      mediaRecorder = new MediaRecorder(mixedStream);
      mediaRecorder.ondataavailable = function (e) {
        chunks.push(e.data);
      };

      mediaRecorder.onstop = function () {
        const blob = new Blob(chunks, { type: "video/mp4" });
        chunks = [];

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "screen_recording.mp4";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      };

      mediaRecorder.start();

      if (!isPaused) {
        startTime = Date.now();
      } else {
        startTime = Date.now() - pauseTime;
        isPaused = false;
      }
      timerInterval = setInterval(updateTimer, 1000);
    })
    .catch(function (error) {
      console.error("Error accessing media devices:", error);
      displayErrorMessage(
        "Failed to access media devices. Please make sure you have the necessary permissions and try again."
      );
    });
}

function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.pause();
    clearInterval(timerInterval);
    isPaused = true;
    pauseTime = Date.now() - startTime;
  }
}

function resumeRecording() {
  if (mediaRecorder && mediaRecorder.state === "paused") {
    mediaRecorder.resume();
    startTime = Date.now() - pauseTime;
    timerInterval = setInterval(updateTimer, 1000);
    isPaused = false;
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    clearInterval(timerInterval);
    recordingTime = 0;
    updateTimer();
  }
}

function updateTimer() {
  const timerElement = document.getElementById("timer");
  recordingTime = Math.floor((Date.now() - startTime) / 1000);
  timerElement.textContent = "Recording time: " + formatTime(recordingTime);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
}

function displayErrorMessage(message) {
  const errorMessageElement = document.createElement("p");
  errorMessageElement.textContent = message;
  errorMessageElement.classList.add("error-message");
  document.body.appendChild(errorMessageElement);
}

document.addEventListener("DOMContentLoaded", function () {
  const startBtn = document.getElementById("startBtn");
  const pauseBtn = document.getElementById("pauseBtn");
  const stopBtn = document.getElementById("stopBtn");

  startBtn.addEventListener("click", startRecording);
  pauseBtn.addEventListener("click", () => {
    if (!isPaused) {
      pauseRecording();
    } else {
      resumeRecording();
    }
  });
  stopBtn.addEventListener("click", stopRecording);
});
