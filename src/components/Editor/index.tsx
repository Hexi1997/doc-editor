import React, { LegacyRef, memo, useCallback, useRef } from "react";
import SimpleMDEEditor from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import WrapperDiv from "./style";
import { FileQiniuStatusType, IFile } from "../../types";
import FileHelper from "../../utils/fileHelper";
import { saveLocation, updateFileInStore } from "../../utils/storeUtils";
import useIpcRenderer from "../../hooks/useIpcRender";
import { canAutoUpload } from "../../utils/storeUtils";
import LuckySheet from "../LuckySheet";
const { ipcRenderer } = window.require("electron");
const { dialog } = window.require("electron").remote;

const path = window.require("path");
interface IProps {
  Files: IFile[];
  updateFiles: (newFile: IFile[]) => void;
}
export default memo(function Editor({ Files, updateFiles }: IProps) {
  const openFiles = Files.filter((item) => item.openStatus === true);
  const activeFiles = Files.filter((item) => item.activeStatus === "active");
  const activeFileBody = activeFiles.length > 0 ? activeFiles[0].body : "";
  const activeFileType =
    activeFiles.length > 0 ? activeFiles[0].fileType : "md";

  const ref = useRef<SimpleMDEEditor>();

  //内容改变事件
  const handleChange = useCallback(
    (value: string) => {
      if (value !== activeFiles[0].body) {
        console.log("doceditor handleChange");
        setTimeout(() => {
          //更新到内存当前内容
          updateFiles(
            Files.map((file) => {
              if (file.id === activeFiles[0].id) {
                file.body = value;
                file.saveStatus = "unsave";
                file.fileQiniuStatus =
                  file.fileQiniuStatus === "unuploaded"
                    ? "unuploaded"
                    : "loaded-not-sync";
              }
              return file;
            })
          );
        }, 0);
      }
    },
    [Files, activeFiles, updateFiles]
  );

  //设置自动同步，同步结果更新到本地和内存
  const updateFilesAndStoreWhenSave = useCallback(
    (status: FileQiniuStatusType) => {
      const dateNow = Date.now();
      //更新内存
      updateFiles(
        Files.map((item) => {
          const newItem = { ...item };
          if (item.id === activeFiles[0].id) {
            newItem.saveStatus = "saved";
            newItem.updateTime = dateNow;
            newItem.fileQiniuStatus = status;
            newItem.body = ref.current?.state.value as string;
          }
          return newItem;
        })
      );
      //更新electron中
      updateFileInStore(activeFiles[0].id, {
        updateTime: dateNow,
        fileQiniuStatus: status,
      });
    },
    [Files, activeFiles, updateFiles]
  );

  const saveCurrentFile = useCallback(() => {
    if (activeFileType === "md") {
      console.log("触发markdown文件保存");
      activeFiles.length &&
        setTimeout(() => {
          //保存当前值到本地文件
          const location = path.join(
            saveLocation,
            activeFiles[0].title + "." + activeFileType
          );
          FileHelper.writeFile(location, activeFiles[0].body)
            .then((v) => {
              const uploadType = canAutoUpload();
              if (uploadType === "no" || uploadType === "no-set") {
                const dateNow = Date.now();
                //更新内存
                const originQiniuStatus = activeFiles[0].fileQiniuStatus;
                updateFiles(
                  Files.map((item) => {
                    const newItem = { ...item };
                    if (item.id === activeFiles[0].id) {
                      newItem.saveStatus = "saved";
                      newItem.updateTime = dateNow;
                      newItem.fileQiniuStatus =
                        newItem.fileQiniuStatus === "unuploaded"
                          ? "unuploaded"
                          : "loaded-not-sync";
                      newItem.body = ref.current?.state.value as string;
                    }
                    return newItem;
                  })
                );
                //更新electron
                updateFileInStore(activeFiles[0].id, {
                  updateTime: dateNow,
                  fileQiniuStatus:
                    originQiniuStatus === "unuploaded"
                      ? "unuploaded"
                      : "loaded-not-sync",
                });
                uploadType === "no" &&
                  dialog.showErrorBox(
                    "自动同步失败",
                    "请配置七牛云相关配置或者关闭自动同步"
                  );
                uploadType === "no-set" &&
                  console.log("未设置自动同步，保存到本地即可");
                return;
              } else {
                ipcRenderer.send("auto-save-file", location);
                ipcRenderer.once(
                  "auto-save-file-reply",
                  (event: any, bSus: boolean) => {
                    //回调，判断是否上传成功，如果上传成功，更新本地
                    if (bSus) {
                      updateFilesAndStoreWhenSave("loaded-sync");
                    } else {
                      updateFilesAndStoreWhenSave("loaded-not-sync");
                      dialog.showErrorBox(
                        "自动同步失败",
                        "请检查七牛云配置是否正确"
                      );
                    }
                  }
                );
              }
            })
            .catch((err) => {
              console.error(err);
            });
        }, 500);
    }
  }, [
    Files,
    activeFiles,
    updateFiles,
    updateFilesAndStoreWhenSave,
    activeFileType,
  ]);

  //定义保存当前文件快捷键Ctrl+S
  useIpcRenderer({
    "file-save": saveCurrentFile,
  });

  if (openFiles.length === 0) {
    return (
      <h3 style={{ color: "#ccc", textAlign: "center", marginTop: "6rem" }}>
        请选择或创建 MarkDown/Xlsx 文档
      </h3>
    );
  }

  if (activeFiles.length === 0) {
    return <></>;
  }

  let tipText = "";
  const date = new Date(activeFiles[0].updateTime);
  switch (activeFiles[0].fileQiniuStatus) {
    case "unuploaded":
      tipText = "未上传";
      break;
    case "loaded-sync":
      tipText = `已同步  上次同步时间 ${
        date.toLocaleDateString() + date.toLocaleTimeString()
      }`;
      break;
    case "loaded-not-sync":
      tipText = `未同步  上次同步时间 ${
        date.toLocaleDateString() + date.toLocaleTimeString()
      }`;

      break;
    default:
      tipText = "未上传";
      break;
  }
  return (
    <WrapperDiv>
      {activeFileType === "md" && (
        <SimpleMDEEditor
          ref={ref as LegacyRef<SimpleMDEEditor>}
          id={activeFiles[0].id}
          key={activeFiles[0].id}
          value={activeFileBody}
          onChange={handleChange}
          //使用code mirror的快捷键，这里用全局定义
          // extraKeys={genExtraKeys()}
        />
      )}
      <LuckySheet
        file={activeFiles[0]}
        files={Files}
        updateFiles={updateFiles}
      />

      <div className="saveText">{tipText}</div>
    </WrapperDiv>
  );
});
