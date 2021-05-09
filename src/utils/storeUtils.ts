import { IFile } from "../types";
const path = window.require("path");
const { app } = window.require("electron").remote;
const Store = window.require("electron-store");
const store = new Store();
// store.delete("files");
/**
 * 文件信息在本地中保存目录
 */
export const saveLocation = app.getPath("documents");

/**
 * 新增文件信息到store
 */
export const addFileToStore = (file: IFile) => {
  const oriFiles = store.get("files") || [];
  const newFile = {
    title: file.title,
    id: file.id,
    path: path.join(saveLocation, file.title + "." + file.fileType),
    createAt: file.createAt,
    fileQiniuStatus: file.fileQiniuStatus,
    updateTime: file.updateTime,
  };
  store.set("files", [...oriFiles, newFile]);
};

/**
 * 多个新增文件保存到store
 */
export const addFilesToStore = (files: IFile[]) => {
  var oriFiles = store.get("files") || [];
  var newFiles = files.map((file) => {
    var newFile = {
      title: file.title,
      id: file.id,
      path: path.join(saveLocation, file.title + "." + file.fileType),
      createAt: file.createAt,
      fileQiniuStatus: file.fileQiniuStatus,
      updateTime: file.updateTime,
    };
    return newFile;
  });
  store.set("files", [...oriFiles, ...newFiles]);
};

/**
 * 更新文件内容
 * @param id 文件id
 * @param obj 要更新的内容
 */
export const updateFileInStore = (id: string, obj: object) => {
  const files = (store.get("files") || []) as IFile[];
  const newFiles = files.map((file) => {
    if (file.id === id) {
      file = { ...file, ...obj };
    }
    return file;
  });
  store.set("files", newFiles);
};

/**
 * 给store中的文件改名
 */
export const changeFileNameOnStore = (file: IFile) => {
  const oriFiles = store.get("files") || [];
  const newFile = {
    title: file.title,
    id: file.id,
    path: path.join(saveLocation, file.title + "." + file.fileType),
    createAt: file.createAt,
    fileQiniuStatus: file.fileQiniuStatus,
    updateTime: file.updateTime,
  };
  const index = oriFiles.findIndex((item: any) => item.id === file.id);
  oriFiles.splice(index, 1, newFile);
  store.set("files", [...oriFiles]);
};

/**
 * 删除store中的文件对象
 * @param file 删除的文件对象
 */
export const deleteFileOnStore = (file: IFile) => {
  const oriFiles = store.get("files") || [];
  const newFiles = oriFiles.filter((item: any) => item.id !== file.id);
  store.set("files", newFiles);
};

/**
 * 获取store中存储的文件列表
 */
export const getFilesInfoFromStore = () => {
  const files = store.get("files") || [];
  return files;
};

type canAutoUploadType = "yes" | "no" | "no-set";

/**
 * 判断是否能够进行自动同步，返回值有三种
 * yes设置了自动上传并且配置了密钥信息
 * no:设置了自动上传但是没有配置密钥信息（一般不会出现这种情况)
 * no-set:没有设置自动上传
 */
export const canAutoUpload = (): canAutoUploadType => {
  const upload = store.get("autoupload");
  const qiniuInfo = store.get("qiniu");
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

/**
 * 判断ak\sk\桶名称是否都配置
 */
export const judgeQiniuInfoSet = () => {
  return !!store.get("qiniu");
};
