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
    path: path.join(saveLocation, file.title + ".md"),
    createAt: file.createAt,
  };
  store.set("files", [...oriFiles, newFile]);
};

/**
 * 给store中的文件改名
 */
export const changeFileNameOnStore = (file: IFile) => {
  const oriFiles = store.get("files") || [];
  const newFile = {
    title: file.title,
    id: file.id,
    path: path.join(saveLocation, file.title + ".md"),
    createAt: file.createAt,
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
