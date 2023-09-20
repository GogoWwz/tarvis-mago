chrome.action.onClicked.addListener(() => {
  captureStart();
})

const captureStart = () => {
  chrome.windows.getCurrent(function (window) {
    var currentWindowId = window.id;
    console.log("Current window ID: " + currentWindowId);

    chrome.tabs.captureVisibleTab(currentWindowId, {
      format: 'png'
    }, (dataUrl) => {
      console.log('captureStart')
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, (tabs) => {
        const message = {
          type: 'capture-complete',
          data: {
            dataUrl
          }
        }
        console.log(tabs)
        console.log(dataUrl)
        chrome.tabs.sendMessage(tabs[0].id, message, {}, res => {
          // response
        })
      })
    })
  });
}
