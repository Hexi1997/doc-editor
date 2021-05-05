const { ipcRenderer, dialog } = window.require("electron");

const Store = window.require("electron-store");
const store = new Store();
/**
 * 设置或者更新七牛云配置
 * @param ak ak
 * @param sk sk
 * @param bucketName bucket名称
 */
const setOrUpdateQiniuInfo = (ak, sk, bucketName) => {
  store.set("qiniu", { ak, sk, bucketName });
};
/**
 * 获取七牛相关配置信息
 */
const getQiniuInfo = () => {
  return store.get("qiniu") || {};
};

const linkElements = document.getElementsByClassName("nav-link");

//从本地读取显示初始值
const qiniuInfo = getQiniuInfo();
document.getElementById("ak").value = qiniuInfo.ak || "";
document.getElementById("sk").value = qiniuInfo.sk || "";
document.getElementById("bucket").value = qiniuInfo.bucketName || "";
/**
 * 取消其他元素的active
 */
const removeActiveOnOthers = () => {
  for (let i = 0; i < linkElements.length; i++) {
    if (linkElements[i].classList.contains("active")) {
      linkElements[i].classList.remove("active");
      let contentId = linkElements[i].getAttribute("href");
      contentId = contentId.replace("#", "");
      document.getElementById(contentId).classList.remove("active");
      break;
    }
  }
};

for (let i = 0; i < linkElements.length; i++) {
  //添加onClick事件
  const elementNav = linkElements[i];
  elementNav.addEventListener("click", (e) => {
    //添加点击事件
    e.preventDefault();

    //取消其他元素的active
    removeActiveOnOthers();

    //设置当前active
    elementNav.classList.add("active");
    let contentId = elementNav.getAttribute("href");
    contentId = contentId.replace("#", "");
    document.getElementById(contentId).classList.add("active");
  });
}

document.getElementById("save").addEventListener("click", () => {
  //保存事件
  //判断当前是哪个tab
  let activeLinkIndex = -1;
  for (let i = 0; i < linkElements.length; i++) {
    if (linkElements[i].classList.contains("active")) {
      activeLinkIndex = i;
      break;
    }
  }
  switch (activeLinkIndex) {
    case 0:
      //七牛云同步设置保存
      const ak = document.getElementById("ak").value;
      const sk = document.getElementById("sk").value;
      const bucketName = document.getElementById("bucket").value;
      if (ak && sk && bucketName) {
        //保存到electron-store中进行持久化
        setOrUpdateQiniuInfo(ak, sk, bucketName);
        //监听到qiniuInfo更新
        ipcRenderer.send("qiniu-info-update", { ak, sk, bucketName });
        alert("保存成功");
      } else {
        alert("信息不完整，保存失败");
      }
      break;

    default:
      break;
  }
});
