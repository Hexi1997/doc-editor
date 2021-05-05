import { faFileImport, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useCallback, useRef } from "react";
import { ButtonType, FileQiniuStatusType, IFile } from "../../types";
import { v4 as uuid } from "uuid";
import FileHelper from "../../utils/fileHelper";
import {
  addFileToStore,
  canAutoUpload,
  saveLocation,
} from "../../utils/storeUtils";
import useIpcRenderer from "../../hooks/useIpcRender";
const { ipcRenderer } = window.require("electron");
const { dialog } = window.require("electron").remote;
const { basename, extname, join } = window.require("path");

interface IProps {
  type: ButtonType;
  Files: IFile[];
  addFiles: (newFiles: IFile[]) => void;
}

export default memo(function DocButton({ type, addFiles, Files }: IProps) {
  //避免打开两个import窗口
  const importWindowRef = useRef(false);

  let icon = null;
  let text = "";
  let btnClsName = "";
  switch (type) {
    case "import":
      icon = faFileImport;
      text = "导入";
      btnClsName = "btn-success";
      break;
    case "new":
      icon = faPlus;
      text = "新建";
      btnClsName = "btn-primary";
      break;
    default:
      icon = faPlus;
      text = "新建";
      btnClsName = "btn-primary";
      break;
  }

  const updateImportFilesAndStore = useCallback(
    (targetPaths: string[], status: FileQiniuStatusType) => {
      //如果paths是数组并且有数值，将其添加到文件中即可,构建File对象并将其添加
      const newFiles: IFile[] = [];
      targetPaths.forEach((path) => {
        const newFile: IFile = {
          id: uuid(),
          body: "",
          title: basename(path, extname(path)),
          createAt: Date.now(),
          fileType: "md",
          openStatus: false,
          activeStatus: "unactive",
          saveStatus: "saved",
          searchShow: true,
          fileQiniuStatus: status,
          updateTime: Date.now(),
        };
        newFiles.push(newFile);
        //更新到store
        addFileToStore(newFile);
      });
      //更新到内容
      addFiles(newFiles);
    },
    [addFiles]
  );

  const handleClick = useCallback(
    (type: ButtonType) => {
      //根据点击类型执行不同操作
      return () => {
        console.log("进入handleClick");
        if (type === "new") {
          //新建一个file对象
          const newFile: IFile = {
            id: uuid(),
            body: "## 请输入内容",
            title: "",
            fileType: "md",
            createAt: Date.now(),
            openStatus: false,
            activeStatus: "unactive",
            saveStatus: "saved",
            searchShow: true,
            fileQiniuStatus: "unuploaded",
            updateTime: Date.now(),
          };
          addFiles([newFile]);
        } else if (type === "import") {
          //导入，渲染进程使用remote打开对话框
          console.log(importWindowRef.current);
          if (!importWindowRef.current) {
            importWindowRef.current = true;
            dialog.showOpenDialog(
              {
                title: "选择导入的markdown文件",
                properties: ["openfile", "multiSelections"],
                filters: [{ name: "Markdown files", extensions: ["md"] }],
              },
              (paths: any) => {
                importWindowRef.current = false;
                if (Array.isArray(paths) && paths.length > 0) {
                  const promises: Promise<unknown>[] = [];
                  //首先判断文件名不能重复
                  const currentTitles = Files.map((file) => file.title);
                  let bSame = false;
                  paths.forEach((path) => {
                    const title = basename(path, extname(path));
                    if (currentTitles.indexOf(title) >= 0) {
                      //文件名重复
                      bSame = true;
                    }
                  });
                  if (bSame) {
                    alert("导入文件名不得重复");
                    return;
                  }
                  paths.forEach((path) => {
                    //将当前文件复制并拷贝到指定位置
                    const targetPath = join(saveLocation, basename(path));
                    promises.push(FileHelper.copyFile(path, targetPath));
                  });
                  Promise.all(promises)
                    .then((targetPaths) => {
                      //全部拷贝到位，这时候应该判断是否自动上传
                      const uploadType = canAutoUpload();
                      if (uploadType === "yes") {
                        //让主线程上传全部文件到服务器
                        ipcRenderer.send(
                          "qiniu-import-files-upload",
                          targetPaths
                        );
                        ipcRenderer.once(
                          "qiniu-import-files-upload-reply",
                          (event: any, bSus: any) => {
                            //监听返回，判断是否全部上传成功
                            updateImportFilesAndStore(
                              targetPaths as string[],
                              bSus ? "loaded-sync" : "unuploaded"
                            );
                            if (!bSus) {
                              dialog.showErrorBox(
                                "自动同步失败",
                                "可在云同步中取消自动更新或者检查七牛云参数设置是否正确"
                              );
                            }
                          }
                        );
                      } else {
                        updateImportFilesAndStore(
                          targetPaths as string[],
                          "unuploaded"
                        );
                        if (uploadType === "no") {
                          dialog.showErrorBox(
                            "自动同步失败",
                            "请配置七牛云ak、sk和桶名"
                          );
                        }
                      }
                    })
                    .catch((err) => {
                      console.error(err);
                    });
                }
              }
            );
          }
        }
      };
    },
    [addFiles, Files, updateImportFilesAndStore]
  );

  useIpcRenderer({
    "file-new": handleClick("new"),
    "file-import": handleClick("import"),
  });

  return (
    <button
      onClick={handleClick(type)}
      className={
        btnClsName + " w-50 d-flex justify-content-center align-items-center"
      }
    >
      <FontAwesomeIcon icon={icon} />
      <span
        style={{
          display: "inline-block",
          marginLeft: ".5rem",
          fontSize: ".8rem",
          marginTop: "0.3rem",
          marginBottom: "0.3rem",
        }}
      >
        {text}
      </span>
    </button>
  );
});
