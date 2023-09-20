chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'capture-complete': captureComplete(request.data); break;
  }
  sendResponse('done');
})

const captureComplete = async ({ dataUrl }) => {
  console.log('captureComplete')
  // 在背景页中打印设备像素比
  console.log("window.devicePixelRatio: ", window.devicePixelRatio);

  console.log(dataUrl)

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
    console.log("mousedown", e)
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
    console.log("mouseup", e)
    flag = false
    endX = e.pageX
    endY = e.pageY

    console.log('开始坐标->', startX, startY)
    console.log('结束坐标->', endX, endY)

    removeSelectListener();
    removeSelectElement();

    const imageSrc = await cropImage(dataUrl, startX, startY, Math.abs(e.pageX - startX), Math.abs(e.pageY - startY));
    console.log(imageSrc)
    const imgageBlob = base64ToBlob(imageSrc)
    try {
      const formData = new FormData();
      formData.append('file', imgageBlob, 'capture.jpg');

      console.log(formData.get('file'))

      const res = await fetch('https://tarvisai.cn/api/skill/ocr', {
        method: 'POST',
        body: formData,
        // 不能加这个，不然会出现没有boundary的错误
        // headers: {
        //   'Content-Type': 'multipart/form-data',
        // },
      });
      if (res.ok) {
        const { data } = await res.json()
        const div = document.createElement('div')
        const h2 = document.createElement('h2')
        const p = document.createElement('p')
        div.setAttribute('id', 'result')
        h2.innerHTML = 'Tarvis识别完成，已为您复制到剪贴板！'
        p.innerHTML = data
        div.append(h2)
        div.append(p)
        document.body.append(div)
        copyToClipboard(data);
        setTimeout(() => {
          document.body.removeChild(div)
        }, 3 * 1000)
      }
    } catch (error) {
      console.log(error)
    }
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
    const ratio = window.devicePixelRatio;
    return new Promise((resolve) => {
      let img = new Image();
      img.src = dataUrl;
      img.onload = function () {
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        ctx.drawImage(img, -startX * ratio, -startY * ratio)
        resolve(canvas.toDataURL('image/jpeg', 1))
      };
    })
  };

  function base64ToBlob(base64Data) {
    const parts = base64Data.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
  
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
  
    return new Blob([uInt8Array], { type: contentType });
  }

  document.body.addEventListener('mousedown', selectStart)
  document.body.addEventListener('mousemove', selectMoving)
  document.body.addEventListener('mouseup', selectEnd)

  document.body.append(div)
  document.body.append(seleciton)
}

// 创建一个辅助函数，用于将内容复制到剪贴板
function copyToClipboard(text) {
  // 创建一个临时的文本输入框元素
  const textarea = document.createElement('textarea');
  
  // 设置文本输入框的值为要复制的文本
  textarea.value = text;
  
  // 将文本输入框添加到文档中
  document.body.appendChild(textarea);
  
  // 选择文本输入框中的内容
  textarea.select();
  
  // 将选择的内容复制到剪贴板
  document.execCommand('copy');
  
  // 移除临时的文本输入框
  document.body.removeChild(textarea);
}
