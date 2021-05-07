const { ipcMain, BrowserWindow } = require("electron");
const Store = require("electron-store");
const store = new Store();
//判断store中是否有qiniu相关配置
const qiniuEnable = !!store.get("qiniu");
const autoUpload = store.get("autoupload") || false;
console.log(autoUpload);
export type FILE_OPERATE_TYPE =
  | "file-save"
  | "file-new"
  | "file-search"
  | "file-import";

/**
 * 发送消息
 * @param browserWindow 窗体
 * @param type 消息类型
 */
const sendMessage = (browserWindow: any, type: FILE_OPERATE_TYPE) => {
  browserWindow.webContents.send(type);
};

let template = [
  {
    label: "文件",
    submenu: [
      {
        label: "新建",
        accelerator: "CmdOrCtrl+N",
        click: (_: any, browserWindow: any) => {
          sendMessage(browserWindow, "file-new");
        },
      },
      {
        label: "保存",
        accelerator: "CmdOrCtrl+S",
        click: (_: any, browserWindow: any) => {
          sendMessage(browserWindow, "file-save");
        },
      },
      {
        label: "搜索",
        accelerator: "CmdOrCtrl+F",
        click: (_: any, browserWindow: any) => {
          sendMessage(browserWindow, "file-search");
        },
      },
      {
        label: "导入",
        accelerator: "CmdOrCtrl+O",
        click: (_: any, browserWindow: any) => {
          sendMessage(browserWindow, "file-import");
        },
      },
    ],
  },
  {
    label: "云同步",
    submenu: [
      {
        label: "设置",
        click: (_: any, browserWindow: any) => {
          ipcMain.emit("open-setting-window");
        },
      },
      {
        label: "自动同步",
        type: "checkbox",
        checked: autoUpload,
        click: () => {
          const currentState = store.get("autoupload") || false;
          store.set("autoupload", !currentState);
        },
        enabled: qiniuEnable,
      },
      {
        label: "全部同步到云端",
        enabled: qiniuEnable,
        click: (_: any, browserWindow: any) => {
          browserWindow.webContents.send("upload-all-files-in-render");
        },
      },
      {
        enabled: qiniuEnable,
        label: "从云端下载到本地",
        click: () => {
          ipcMain.emit("download-all-files-to-local");
        },
      },
    ],
  },
  {
    label: "视图",
    submenu: [
      {
        label: "重载",
        accelerator: "CmdOrCtrl+R",
        click: function (_: any, focusedWindow) {
          if (focusedWindow) focusedWindow.reload();
        },
      },
      {
        label: "全屏切换",
        accelerator: (function () {
          if (process.platform === "darwin") return "Ctrl+Command+F";
          else return "F11";
        })(),
        click: function (_: any, focusedWindow) {
          if (focusedWindow)
            focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
        },
      },
      {
        label: "切换开发者工具",
        accelerator: (function () {
          if (process.platform === "darwin") return "Alt+Command+I";
          else return "Ctrl+Shift+I";
        })(),
        click: function (_: any, focusedWindow) {
          if (focusedWindow) focusedWindow.toggleDevTools();
        },
      },
    ],
  },
];

export default template;
