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
import { getFilesInfoFromStore } from "./utils/storeUtils";
function App() {
  //自顶向下的数据流
  const [files, setFiles] = useState<IFile[]>([]);
  //更新文件列表--包括删除、更新
  const updateFiles = useCallback((newFiles: IFile[]) => {
    setFiles(newFiles);
    console.log(newFiles);
  }, []);

  useEffect(() => {
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
      };
      return file;
    });
    setFiles(FilesLocal);
  }, []);

  //新增文件列表
  const addFile = useCallback(
    (newFile: IFile) => {
      //不能重复点击新建，首先判断是否已经有为空
      if (files.filter((item) => item.title === "").length === 0) {
        setFiles([...files, newFile]);
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
            <DocButton type="new" addFile={addFile} />
            {/* 导入文件 */}
            <DocButton type="import" addFile={addFile} />
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
    </div>
  );
}

export default App;
