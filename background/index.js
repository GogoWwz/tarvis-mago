// chrome.runtime.onMessage.addListener((message) => {
//   switch (message.type) {
//     case 'capture-start': captureStart(); break;
//   }
// })

chrome.action.onClicked.addListener(tab => {
  captureStart();
})

const captureStart = () => {
  chrome.tabs.captureVisibleTab(chrome.windows.WINDOW_ID_CURRENT, {
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
      chrome.tabs.sendMessage(tabs[0].id, message, res => {
        // response
      })
    })
  })
}
