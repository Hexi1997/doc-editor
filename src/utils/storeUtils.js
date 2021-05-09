var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s)
            if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
      to[j] = from[i];
    return to;
  };
exports.__esModule = true;
exports.judgeQiniuInfoSet = exports.canAutoUpload = exports.getFilesInfoFromStore = exports.deleteFileOnStore = exports.changeFileNameOnStore = exports.updateFileInStore = exports.addFileToStore = exports.saveLocation = void 0;
var path = window.require("path");
var app = window.require("electron").remote.app;
var Store = window.require("electron-store");
var store = new Store();
// store.delete("files");
/**
 * 文件信息在本地中保存目录
 */
exports.saveLocation = app.getPath("documents");
/**
 * 新增文件信息到store
 */
var addFileToStore = function (file) {
  var oriFiles = store.get("files") || [];
  var newFile = {
    title: file.title,
    id: file.id,
    path: path.join(exports.saveLocation, file.title + "." + file.fileType),
    createAt: file.createAt,
    fileQiniuStatus: file.fileQiniuStatus,
    updateTime: file.updateTime,
  };
  store.set("files", __spreadArray(__spreadArray([], oriFiles), [newFile]));
};

/**
 * 多个新增文件保存到store
 */
exports.addFileToStore = addFileToStore;
var addFilesToStore = function (files) {
  var oriFiles = store.get("files") || [];
  var newFiles = files.map(function (file) {
    var newFile = {
      title: file.title,
      id: file.id,
      path: path.join(exports.saveLocation, file.title + "." + file.fileType),
      createAt: file.createAt,
      fileQiniuStatus: file.fileQiniuStatus,
      updateTime: file.updateTime,
    };
    return newFile;
  });
  store.set("files", __spreadArray(__spreadArray([], oriFiles), newFiles));
};
exports.addFilesToStore = addFilesToStore;
/**
 * 更新文件内容
 * @param id 文件id
 * @param obj 要更新的内容
 */
var updateFileInStore = function (id, obj) {
  var files = store.get("files") || [];
  var newFiles = files.map(function (file) {
    if (file.id === id) {
      file = __assign(__assign({}, file), obj);
    }
    return file;
  });
  store.set("files", newFiles);
};
exports.updateFileInStore = updateFileInStore;
/**
 * 给store中的文件改名
 */
var changeFileNameOnStore = function (file) {
  var oriFiles = store.get("files") || [];
  var newFile = {
    title: file.title,
    id: file.id,
    path: path.join(exports.saveLocation, file.title + "." + file.fileType),
    createAt: file.createAt,
    fileQiniuStatus: file.fileQiniuStatus,
    updateTime: file.updateTime,
  };
  var index = oriFiles.findIndex(function (item) {
    return item.id === file.id;
  });
  oriFiles.splice(index, 1, newFile);
  store.set("files", __spreadArray([], oriFiles));
};
exports.changeFileNameOnStore = changeFileNameOnStore;
/**
 * 删除store中的文件对象
 * @param file 删除的文件对象
 */
var deleteFileOnStore = function (file) {
  var oriFiles = store.get("files") || [];
  var newFiles = oriFiles.filter(function (item) {
    return item.id !== file.id;
  });
  store.set("files", newFiles);
};
exports.deleteFileOnStore = deleteFileOnStore;
/**
 * 获取store中存储的文件列表
 */
var getFilesInfoFromStore = function () {
  var files = store.get("files") || [];
  return files;
};
exports.getFilesInfoFromStore = getFilesInfoFromStore;
/**
 * 判断是否能够进行自动同步，返回值有三种
 * yes设置了自动上传并且配置了密钥信息
 * no:设置了自动上传但是没有配置密钥信息（一般不会出现这种情况)
 * no-set:没有设置自动上传
 */
var canAutoUpload = function () {
  var upload = store.get("autoupload");
  var qiniuInfo = store.get("qiniu");
  if (upload && qiniuInfo) {
    return "yes";
  }
  if (upload && !qiniuInfo) {
    return "no";
  }
  if (!upload) {
    return "no-set";
  }
  return "no";
};
exports.canAutoUpload = canAutoUpload;
/**
 * 判断ak\sk\桶名称是否都配置
 */
var judgeQiniuInfoSet = function () {
  return !!store.get("qiniu");
};
exports.judgeQiniuInfoSet = judgeQiniuInfoSet;
