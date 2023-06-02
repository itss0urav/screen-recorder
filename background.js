// Add this line inside the startRecording() function to trigger the animation
document.querySelector('.container').classList.add('visible');

chrome.action.onClicked.addListener(function (tab) {
  chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") });
});
