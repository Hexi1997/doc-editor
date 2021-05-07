import React, { useCallback, useEffect } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import FileSearch from "./components/FileSearch";
import FileList from "./components/FileList";
import { IFile } from "./types";
import TabNav from "./components/TabNav";
import { useState } from "react";
import DocButton from "./components/DocButton";
import Editor from "./components/Editor";
import {
  addFilesToStore,
  getFilesInfoFromStore,
  updateFileInStore,
} from "./utils/storeUtils";
import useIpcRenderer from "./hooks/useIpcRender";
import { v4 as uuid } from "uuid";
const { ipcRenderer } = window.require("electron");
const { dialog, getCurrentWindow } = window.require("electron").remote;
function App() {
  //自顶向下的数据流
  const [files, setFiles] = useState<IFile[]>([]);
  //全部上传到云端的loading状态
  const [isLoading, setLoading] = useState(false);
  //更新文件列表--包括删除、更新
  const updateFiles = useCallback((newFiles: IFile[]) => {
    setFiles(newFiles);
  }, []);

  const getFilesFromStore = useCallback(() => {
    let storeFiles: any = getFilesInfoFromStore();
    const FilesLocal = storeFiles.map((item: any, index: any) => {
      let file: IFile = {
        id: item.id,
        title: item.title,
        body: "",
        createAt: item.createAt,
        fileType: "md",
        openStatus: false,
        activeStatus: "unactive",
        saveStatus: "saved",
        searchShow: true,
        fileQiniuStatus: item.fileQiniuStatus,
        updateTime: item.updateTime,
      };
      return file;
    });
    setFiles(FilesLocal);
  }, [setFiles]);

  useEffect(() => {
    getFilesFromStore();
  }, [getFilesFromStore]);

  //下载全部文件到本地后，更新store和Files
  const updateFilesAndStoreWhenDownAll = useCallback(
    (event: any, downloadObj: any) => {
      console.log("全部下载到本地成功，开始更新electron-store", downloadObj);
      //step 1: update electron-store
      const newFilesNames = [];
      const updateFilesNames = [];
      for (let i in downloadObj) {
        if (downloadObj[i] === "new") {
          newFilesNames.push(i);
        } else {
          updateFilesNames.push(i);
        }
      }
      if (newFilesNames.length > 0) {
        const newFiles: IFile[] = newFilesNames.map((name) => {
          const dateNow = Date.now();
          return {
            title: name.replace(".md", ""),
            id: uuid(),
            body: "",
            createAt: dateNow,
            fileType: "md",
            openStatus: false,
            activeStatus: "unactive",
            saveStatus: "saved",
            searchShow: true,
            fileQiniuStatus: "loaded-sync",
            updateTime: dateNow,
          };
        });
        addFilesToStore(newFiles);
      }
      if (updateFilesNames.length > 0) {
        //更新文件
        updateFilesNames.forEach((name) => {
          const current = files.find(
            (file) => file.title + ".md" === name
          ) as IFile;
          updateFileInStore(current.id, {
            fileQiniuStatus: "loaded-sync",
            updateTime: Date.now(),
          });
        });
      }
      //step 2: let render process update files and electron-store
      getFilesFromStore();

      //step 3: tip
      dialog.showMessageBox(getCurrentWindow(), {
        type: "info",
        title: "下载成功",
        message: `下载成功，当前文件和云文件同步`,
      });
    },
    [files, getFilesFromStore]
  );

  //新增文件列表
  const addFiles = useCallback(
    (newFiles: IFile[]) => {
      //不能重复点击新建，首先判断是否已经有为空
      if (files.filter((item) => item.title === "").length === 0) {
        setFiles([...files, ...newFiles]);
      }
    },
    [setFiles, files]
  );

  //搜索文件列表
  const searchFiles = useCallback(
    (txt: string) => {
      txt = txt.trim();
      //基于FilesLocal做查询，查询结果更新到
      if (txt === "") {
        //txt为空串,设置所有项的searchShow为true
        const newFiles = [...files];
        newFiles.forEach((item) => (item.searchShow = true));
        setFiles(newFiles);
        return;
      }
      const newFiles = files.map((item) => {
        item.searchShow = item.title.includes(txt);
        return { ...item };
      });

      setFiles(newFiles);
    },
    [files]
  );

  //上传全部文件到七牛云
  const uploadAllFiles = useCallback(() => {
    setLoading(true);
    const fileNames = files.map((file) => file.title);
    ipcRenderer.send("upload-all-files-in-main", fileNames);
    ipcRenderer.once(
      "upload-all-files-in-main-reply",
      (event: any, bSus: boolean) => {
        setLoading(false);
        if (bSus) {
          dialog.showMessageBox(getCurrentWindow(), {
            type: "info",
            title: "上传成功",
            message: `全部成功上传`,
          });
        } else {
          dialog.showErrorBox(
            "上传失败",
            "请确认网络情况良好并且七牛云参数设置正确"
          );
        }
      }
    );
  }, [files]);

  //使用IpcRender监听upload-all-files事件
  useIpcRenderer({
    "upload-all-files-in-render": uploadAllFiles,
    "down-all-update-files-and-store": updateFilesAndStoreWhenDownAll,
    "set-load-status": (event: any, bLoading: boolean) => {
      setLoading(bLoading);
    },
  });
  return (
    <div className="container-fluid">
      <div className="row" style={{ height: "100vh" }}>
        {/* 左侧区域 */}
        <div className="left-panel col-3 p-0 d-flex flex-column h-100">
          {/* 文件搜索组件 */}
          <FileSearch searchFiles={searchFiles} />
          {/* 文件列表组件 */}
          <FileList Files={files} updateFiles={updateFiles} />
          {/* 底部按钮组 */}
          <div className="bottom-btns d-flex justify-content-between">
            {/* 新建文件 */}
            <DocButton type="new" addFiles={addFiles} Files={files} />
            {/* 导入文件 */}
            <DocButton type="import" addFiles={addFiles} Files={files} />
          </div>
        </div>
        {/* 右侧区域 */}
        <div className="right-panel col-9 pl-0 pr-0">
          {/* Tab栏目 */}
          <TabNav Files={files} updateFiles={updateFiles} />
          {/* 编辑器区域 */}
          <Editor Files={files} updateFiles={updateFiles} />
        </div>
      </div>
      <div
        className="spinner-border"
        role="status"
        style={{
          visibility: isLoading ? "visible" : "hidden",
          position: "absolute",
          top: "50%",
          left: "50%",
        }}
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

export default App;
