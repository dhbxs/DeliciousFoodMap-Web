
let amapLoaded = false;
let amapLoadPromise = null;


export function loadAmapAPI(apiKey) {
  // 如果已经加载过，直接返回
  if (amapLoaded && window.AMap) {
    return Promise.resolve(window.AMap);
  }

  if (amapLoadPromise) {
    return amapLoadPromise;
  }

  // 创建加载 Promise
  amapLoadPromise = new Promise((resolve, reject) => {
    if (window.AMap) {
      amapLoaded = true;
      resolve(window.AMap);
      return;
    }

    const key = apiKey || '';
    

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}&plugin=AMap.Scale,AMap.ToolBar,AMap.ControlBar,AMap.Geolocation`;
    script.onload = () => {
      if (window.AMap) {
        amapLoaded = true;
        console.log('高德地图 API 加载成功');
        resolve(window.AMap);
      } else {
        reject(new Error('高德地图 API 加载失败'));
      }
    };
    
   
    script.onerror = () => {
      reject(new Error('高德地图 API 脚本加载失败'));
    };
    document.head.appendChild(script);
  });

  return amapLoadPromise;
}


export function isAmapLoaded() {
  return amapLoaded && window.AMap;
}

export function getAMap() {
  return window.AMap || null;
}
