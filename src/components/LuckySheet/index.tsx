import React, { memo, useCallback, useEffect, useRef } from "react";
import {
  saveLocation,
  canAutoUpload,
  updateFileInStore,
} from "../../utils/storeUtils";
import { FileQiniuStatusType, IFile } from "../../types";
import FileHelper from "../../utils/fileHelper";
import useIpcRenderer from "../../hooks/useIpcRender";
const { join } = window.require("path");
const { dialog } = window.require("electron").remote;
const { ipcRenderer } = window.require("electron");

interface IProps {
  file: IFile;
  files: IFile[];
  updateFiles: (newFile: IFile[]) => void;
}
export default memo(function LuckySheet({ file, files, updateFiles }: IProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  console.log(sheetRef?.current);

  const beforeFileRef = useRef<IFile | null>(null);
  useEffect(() => {
    if (
      file.fileType === "xlsx" &&
      (!beforeFileRef.current ||
        (beforeFileRef.current.updateTime !== file.updateTime &&
          beforeFileRef.current.id === file.id))
    ) {
      //第一次或者保存，初始化，读取文件内容赋值给luckysheet
      FileHelper.readFile(
        join(saveLocation, `./${file.title}.${file.fileType}`)
      )
        .then((v: any) => {
          //初始化表格控件，创建一个容器container
          const luckysheet = (window as any).luckysheet;
          console.log(v);
          // luckysheet.destroy();
          let option = JSON.parse(v);
          option.allowUpdate = true;
          option.hook = {
            updated: () => {
              console.log("触发表格更新");
              console.log((window as any).luckysheet.getAllSheets());
              //更新当前文件的;
              updateFiles(
                files.map((fileitem) => {
                  let item = { ...fileitem };
                  if (item.id === file.id) {
                    item.saveStatus = "unsave";
                  }
                  return item;
                })
              );
            },
          };
          luckysheet.create(option);
          beforeFileRef.current = file;
          console.log("加载成功");
        })
        .catch((e: any) => {
          console.log(e);
          console.log("加载失败");
        });
    }
  }, [file, files, updateFiles]);

  //设置自动同步，同步结果更新到本地和内存
  const updateFilesAndStoreWhenSave = useCallback(
    (status: FileQiniuStatusType) => {
      const dateNow = Date.now();
      //更新内存
      updateFiles(
        files.map((item) => {
          const newItem = { ...item };
          if (item.id === file.id) {
            newItem.saveStatus = "saved";
            newItem.updateTime = dateNow;
            newItem.fileQiniuStatus = status;
            newItem.body = "";
          }
          return newItem;
        })
      );
      //更新electron中
      updateFileInStore(file.id, {
        updateTime: dateNow,
        fileQiniuStatus: status,
      });
    },
    [files, file, updateFiles]
  );

  //定义保存当前文件快捷键Ctrl+S
  useIpcRenderer({
    "file-save": () => {
      if (file.fileType === "xlsx") {
        console.log("触发表格保存");
        //1、将文件保存到本地
        const luckysheet = (window as any).luckysheet;
        const content = JSON.stringify(luckysheet.toJson());
        const path = join(saveLocation, `${file.title}.${file.fileType}`);
        FileHelper.writeFile(path, content)
          .then((v) => {
            console.log("写入本地文件成功");
            //2、上传到服务器
            const uploadType = canAutoUpload();
            if (uploadType === "no" || uploadType === "no-set") {
              const dateNow = Date.now();
              //更新内存
              const originQiniuStatus = file.fileQiniuStatus;
              updateFiles(
                files.map((item) => {
                  const newItem = { ...item };
                  if (item.id === file.id) {
                    newItem.saveStatus = "saved";
                    newItem.updateTime = dateNow;
                    newItem.fileQiniuStatus =
                      newItem.fileQiniuStatus === "unuploaded"
                        ? "unuploaded"
                        : "loaded-not-sync";
                    newItem.body = "";
                  }
                  return newItem;
                })
              );
              //更新electron
              updateFileInStore(file.id, {
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
              ipcRenderer.send("auto-save-file", path);
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
          .catch((e) => {
            console.log("保存失败，写入本地文件失败");
            dialog.showErrorBox("保存失败", "写入本地文件失败");
          });
      }
    },
  });

  return (
    <div
      ref={sheetRef}
      id="luckysheet"
      style={{
        margin: "0px",
        padding: "0px",
        position: "absolute",
        width: "100%",
        right: "0px",
        top: "40px",
        bottom: "40px",
        visibility: file.fileType === "xlsx" ? "visible" : "hidden",
      }}
    ></div>
  );
});
