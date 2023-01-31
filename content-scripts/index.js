chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'capture-complete': captureComplete(request.data); break;
  }
  sendResponse('done');
})

const { createWorker } = Tesseract;

const captureComplete = async ({ dataUrl }) => {
  console.log('captureComplete')

  let flag = false
  let startX = 0;
  let startY = 0;
  let endX = 0;
  let endY = 0;

  const div = document.createElement('div')
  const seleciton = document.createElement('div')
  div.setAttribute('id', 'screenshot')
  seleciton.setAttribute('id', 'selection')

  function selectStart(e) {
    // console.log("mousedown", e)
    flag = true;
    seleciton.style['left'] = e.pageX + 'px';
    seleciton.style['top'] = e.pageY + 'px';
    startX = e.pageX;
    startY = e.pageY;

  }

  function selectMoving(e) {
    if (flag) {
      // console.log("mousemove", e)
      seleciton.style['width'] = Math.abs(e.pageX - startX) + 'px';
      seleciton.style['height'] = Math.abs(e.pageY - startY) + 'px';
    }
  }

  async function selectEnd(e) {
    // console.log("mouseup", e)
    flag = false
    endX = e.pageX
    endY = e.pageY

    console.log('开始坐标->', startX, startY)
    console.log('结束坐标->', endX, endY)

    removeSelectListener();
    removeSelectElement();

    const imageSrc = await cropImage(dataUrl, startX, startY, Math.abs(e.pageX - startX), Math.abs(e.pageY - startY));
    const worker = await createWorker({
      logger: m => console.log(m)
    });

    await worker.loadLanguage("chi_sim");
    await worker.initialize("chi_sim");

    console.log(worker)
    const { data: { text } } = await worker.recognize(imageSrc);
    console.log(text);
  }

  function removeSelectElement() {
    document.body.removeChild(div);
    document.body.removeChild(seleciton)
  }

  function removeSelectListener() {
    document.body.removeEventListener('mousedown', selectStart)
    document.body.removeEventListener('mousemove', selectMoving)
    document.body.removeEventListener('mouseup', selectEnd)
  }

  function cropImage(dataUrl, startX, startY, width, height) {
    return new Promise((resolve) => {
      let img = new Image();
      img.src = dataUrl;
      img.onload = function () {
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, -startX, -startY)
        resolve(canvas.toDataURL('png'))
      };
    })
  };

  document.body.addEventListener('mousedown', selectStart)
  document.body.addEventListener('mousemove', selectMoving)
  document.body.addEventListener('mouseup', selectEnd)

  document.body.append(div)
  document.body.append(seleciton)
}
