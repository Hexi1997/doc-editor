"use strict";
exports.__esModule = true;
var _a = require("electron"),
  app = _a.app,
  BrowserWindow = _a.BrowserWindow,
  Menu = _a.Menu,
  ipcMain = _a.ipcMain,
  dialog = _a.dialog;
var isDev = require("electron-is-dev");
var Store = require("electron-store");
var path = require("path");
var store = new Store();
var menuTemplate_1 = require("./menuTemplate");
var qiniuManager_1 = require("./nodejs/qiniuManager");
var mainWindow = null;
app.on("ready", function () {
  //运行devtron浏览器插件  add
  // require("devtron").install();
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    show: false,
    backgroundColor: "#fff",
  });
  mainWindow.maximize();
  var urlLocation = isDev
    ? "http://localhost:3000"
    : "file://" + path.join(__dirname, "./build/index.html");
  mainWindow.loadURL(urlLocation);
  //设置菜单
  var menu = Menu.buildFromTemplate(menuTemplate_1["default"]);
  Menu.setApplicationMenu(menu);
  mainWindow.once("ready-to-show", function () {
    mainWindow.show();
  });
  //打开开发者工具
  // mainWindow.webContents.openDevTools();
  //初始化
  var qiniu = store.get("qiniu");
  var manage;
  if (qiniu) {
    manage = new qiniuManager_1.QiniuManager(
      qiniu.ak,
      qiniu.sk,
      qiniu.bucketName
    );
  }
  /**
   * 监听qiniu-info-update事件，就是用户在七牛云信息设置界面点击保存
   */
  ipcMain.on("qiniu-info-update", function (event, qiniu) {
    //重新初始化QiniuManager
    manage = new qiniuManager_1.QiniuManager(
      qiniu.ak,
      qiniu.sk,
      qiniu.bucketName
    );
    //设置云同步下面三个菜单可用
    [1, 2, 3].forEach(function (i) {
      menuTemplate_1["default"][1].submenu[i].enabled = true;
    });
    menu = Menu.buildFromTemplate(menuTemplate_1["default"]);
    Menu.setApplicationMenu(menu);
  });
  /**
   * 在文件编辑页面，保存当前文件时如果设置自动更新，那么同步到云文件
   */
  ipcMain.on("auto-save-file", function (event, location) {
    manage
      .uploadFile(location)
      .then(function (v) {
        console.log("自动保存成功", v);
        event.reply("auto-save-file-reply", true);
      })
      ["catch"](function (err) {
        console.error("自动保存失败", err);
        event.reply("auto-save-file-reply", false);
      });
  });
  //菜单中点击设置弹出对应窗体
  ipcMain.on("open-setting-window", function () {
    //创建设置窗口
    var settingsWindow = new BrowserWindow({
      width: 500,
      height: 400,
      webPreferences: {
        nodeIntegration: true,
      },
      show: false,
      backgroundColor: "#fff",
      //设置父窗口
      parent: mainWindow,
      autoHideMenuBar: true,
    });
    settingsWindow;
    settingsWindow.once("ready-to-show", function () {
      settingsWindow.show();
    });
    settingsWindow.loadFile("./nodejs/views/settings.html");
  });
  //监听删除文件事件，删除七牛云同名文件
  ipcMain.on("qiniu-delete-file", function (event, key) {
    manage
      .deleteFile(key)
      .then(function (v) {
        console.log("已同步删除七牛云中文件", v);
      })
      ["catch"](function (e) {
        console.error(e);
      });
  });
  //监听七牛云新建文件输入标题enter时，如果设置自动更新到七牛云
  ipcMain.on("qiniu-add-new-file", function (event, newFilePath) {
    //发送
    manage
      .uploadFile(newFilePath)
      .then(function (v) {
        console.log("新文件上传成功", v);
        //通知渲染线程，上传成功
        event.reply("qiniu-add-new-file-reply", true);
      })
      ["catch"](function (err) {
        console.error("新文件上传失败", err);
        //通知渲染线程，上传失败
        event.reply("qiniu-add-new-file-reply", false);
      });
  });
  //监听改名
  ipcMain.on("qiniu-rename-file", function (event, args) {
    console.log(args);
    manage
      .renameFile(args.oriName, args.curName)
      .then(function (v) {
        console.log("重命名成功", v);
        event.reply("qiniu-rename-file-reply", true);
      })
      ["catch"](function (e) {
        console.log("重命名失败", e);
        event.reply("qiniu-rename-file-reply", false);
      });
  });
  //监听导入文件
  ipcMain.on("qiniu-import-files-upload", function (event, paths) {
    //批量上传文件
    manage
      .batchUploadFile(paths)
      .then(function (v) {
        console.log("批量上传成功", paths);
        event.reply("qiniu-import-files-upload-reply", true);
      })
      ["catch"](function (e) {
        console.log("批量上传文件失败", e);
        event.reply("qiniu-import-files-upload-reply", false);
      });
  });
  //监听文件双击打开，获取文件信息，判断是否要更新
  ipcMain.on("qiniu-get-file-info", function (event, args) {
    var key = args.key,
      updateTime = args.updateTime;
    manage
      .getFileInfo(key)
      .then(function (v) {
        console.log("获取文件信息成功");
        if (v.putTime > updateTime * 10000) {
          //服务器文件比本地新，需要下载服务器文件到本地
          manage
            .downloadFile(key, app.getPath("documents"), true)
            .then(function (res) {
              console.log("从七牛云同步文件到本地成功", res);
              event.reply("qiniu-get-file-info-reply", 1);
            })
            ["catch"](function (err) {
              console.log("从七牛云同步文件到本地失败", err);
              event.reply("qiniu-get-file-info-reply", -1);
            });
        } else {
          event.reply("qiniu-get-file-info-reply", -2);
        }
      })
      ["catch"](function (e) {
        console.log("获取文件信息失败", e);
        event.reply("qiniu-get-file-info-reply", -3);
      });
  });
  //监听主线程上传全部文件
  ipcMain.on("upload-all-files-in-main", function (event, fileNames) {
    var promises = fileNames.map(function (fileName) {
      var filePath = app.getPath("documents") + "\\" + fileName;
      console.log(filePath);
      return manage.uploadFile(filePath);
    });
    Promise.all(promises)
      .then(function (values) {
        console.log("全部上传成功");
        event.reply("upload-all-files-in-main-reply", true);
      })
      ["catch"](function (err) {
        console.log("全部上传失败");
        event.reply("upload-all-files-in-main-reply", false);
      });
  });
  ipcMain.on("download-all-files-to-local", function () {
    //step zero: set loading status
    mainWindow.webContents.send("set-load-status", true);
    //step one: get files in electron-store
    var Store = require("electron-store");
    var store = new Store();
    var localFiles = store.get("files") || [];
    //step two: get files in qiniu
    var downloadObj = {};
    manage
      .getAllFilesInfo()
      .then(function (v) {
        console.log("获取七牛云全部文件信息成功");
        //step three: filter markdown files
        var mdFiles = v.items.filter(function (item) {
          return (
            item.mimeType === "text/markdown" ||
            item.mimeType.includes("office")
          );
        });
        //step four: compare putTime(qiniu) and updateTime(local) , get download list
        downloadObj = mdFiles.reduce(function (obj, current) {
          var currentFile = localFiles.find(function (file) {
            return path.basename(file.path) === current.key;
          });
          console.log("currentFile", currentFile);
          if (
            !currentFile ||
            currentFile.updateTime * 10000 < current.putTime
          ) {
            //如果currentFile不存在，代表该文件在本地不存在，但是在七牛云存在，将其下载到本地
            //如果本地的updateTime小于七牛云的putTime，代表七牛云文件新，需要下载
            obj[current.key] = currentFile ? "update" : "new";
          }
          return obj;
        }, {});
        //step five: start download files
        return manage.downloadFiles(
          Object.keys(downloadObj),
          app.getPath("documents"),
          true
        );
      })
      .then(function (v) {
        if (Object.keys(downloadObj).length === 0) {
          dialog.showMessageBox(mainWindow, {
            type: "info",
            title: "无需下载",
            message: "没有需要下载的文件，当前的文件已经是最新",
          });
          console.log("没有需要下载的文件，当前的文件已经是最新");
        } else {
          mainWindow.webContents.send(
            "down-all-update-files-and-store",
            downloadObj
          );
        }
      })
      ["catch"](function (e) {
        dialog.showErrorBox("下载失败", "下载文件失败，请确认网络情况良好");
        console.log("获取七牛云全部文件信息失败", e);
      })
      ["finally"](function (v) {
        mainWindow.webContents.send("set-load-status", false);
      });
  });
});
