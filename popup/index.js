const screenshotBtn = document.getElementById('screenshot');

screenshotBtn.addEventListener("click", async () => {
  chrome.runtime.sendMessage({
    type: 'capture-start'
  })
});