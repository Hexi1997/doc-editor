"use strict";
exports.__esModule = true;
var _a = require("electron"),
  ipcMain = _a.ipcMain,
  BrowserWindow = _a.BrowserWindow;
var Store = require("electron-store");
var store = new Store();
//判断store中是否有qiniu相关配置
var qiniuEnable = !!store.get("qiniu");
var autoUpload = store.get("autoupload") || false;
console.log(autoUpload);
/**
 * 发送消息
 * @param browserWindow 窗体
 * @param type 消息类型
 */
var sendMessage = function (browserWindow, type) {
  browserWindow.webContents.send(type);
};
var template = [
  {
    label: "文件",
    submenu: [
      {
        label: "新建",
        accelerator: "CmdOrCtrl+N",
        click: function (_, browserWindow) {
          sendMessage(browserWindow, "file-new");
        },
      },
      {
        label: "保存",
        accelerator: "CmdOrCtrl+S",
        click: function (_, browserWindow) {
          sendMessage(browserWindow, "file-save");
        },
      },
      {
        label: "搜索",
        accelerator: "CmdOrCtrl+F",
        click: function (_, browserWindow) {
          sendMessage(browserWindow, "file-search");
        },
      },
      {
        label: "导入",
        accelerator: "CmdOrCtrl+O",
        click: function (_, browserWindow) {
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
        click: function (_, browserWindow) {
          ipcMain.emit("open-setting-window");
        },
      },
      {
        label: "自动同步",
        type: "checkbox",
        checked: autoUpload,
        click: function () {
          var currentState = store.get("autoupload") || false;
          store.set("autoupload", !currentState);
        },
        enabled: qiniuEnable,
      },
      {
        label: "全部同步到云端",
        enabled: qiniuEnable,
        click: function (_, browserWindow) {
          browserWindow.webContents.send("upload-all-files-in-render");
        },
      },
      {
        enabled: qiniuEnable,
        label: "从云端下载到本地",
        click: function () {
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
        click: function (_, focusedWindow) {
          if (focusedWindow) focusedWindow.reload();
        },
      },
      {
        label: "全屏切换",
        accelerator: (function () {
          if (process.platform === "darwin") return "Ctrl+Command+F";
          else return "F11";
        })(),
        click: function (_, focusedWindow) {
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
        click: function (_, focusedWindow) {
          if (focusedWindow) focusedWindow.toggleDevTools();
        },
      },
    ],
  },
];
exports["default"] = template;
