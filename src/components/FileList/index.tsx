import { faMarkdown } from "@fortawesome/free-brands-svg-icons";
import {
  faFileExcel,
  faFilePowerpoint,
  faFileWord,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import WrapperDiv from "./style";
import { FileQiniuStatusType, FileType, IFile } from "../../types";
import FileHelper from "../../utils/fileHelper";
import useContextMenu from "../../hooks/useContextMenu";
import { getParentNode } from "../../utils/domHelper";
import {
  addFileToStore,
  canAutoUpload,
  changeFileNameOnStore,
  deleteFileOnStore,
  saveLocation,
  updateFileInStore,
} from "../../utils/storeUtils";
const { ipcRenderer } = window.require("electron");
const { dialog, shell } = window.require("electron").remote;
const path = window.require("path");

interface IProps {
  Files: IFile[];
  updateFiles: (newFile: IFile[]) => void;
}
export default memo(function FileList({ Files, updateFiles }: IProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  //处于编辑状态的File的id，为null则代表没有File处于编辑状态
  const [editorFileId, setEditorFileId] = useState<null | string>(null);
  //处于编辑状态的File的title
  const [editorFileTitle, setEditorFileTitle] = useState<null | string>(null);

  //编辑
  const handleEditor = (item: IFile) => {
    return () => {
      setTimeout(() => {
        setEditorFileId(item.id);
        setEditorFileTitle(item.title);
        inputRef.current?.focus();
      }, 0);
    };
  };

  //双击打开文档时更新本地和store
  const updateWhenOpenFile = useCallback(
    (currentFile: IFile, item: IFile, bUpdateFromQiniu: boolean) => {
      //如果当前文件的body为""，需要读取本地文件获取内容
      if (currentFile?.body === "" || bUpdateFromQiniu) {
        const localFilePath = path.join(
          saveLocation,
          currentFile?.title + ".md"
        );
        //读取文件内容并且设置
        FileHelper.readFile(localFilePath)
          .then((v) => {
            //双击选中当前文档
            updateFiles(
              Files.map((file) => {
                const newFile = { ...file };
                if (newFile.id === item.id) {
                  newFile.activeStatus = "active";
                  newFile.body = v as string;
                  newFile.openStatus = true;
                  newFile.fileQiniuStatus = bUpdateFromQiniu
                    ? "loaded-sync"
                    : newFile.fileQiniuStatus;
                  newFile.updateTime = bUpdateFromQiniu
                    ? Date.now()
                    : newFile.updateTime;
                  //更新store
                  if (bUpdateFromQiniu) {
                    updateFileInStore(newFile.id, {
                      fileQiniuStatus: newFile.fileQiniuStatus,
                      updateTime: newFile.updateTime,
                    });
                  }
                } else {
                  newFile.activeStatus = "unactive";
                }
                return newFile;
              })
            );
          })
          .catch((err) => {
            console.log("获得当前文件的内容失败", err);
          });
      } else {
        //设置当前文件的的active
        updateFiles(
          Files.map((file) => {
            const newFile = { ...file };
            if (newFile.id === item.id) {
              newFile.activeStatus = "active";
              newFile.openStatus = true;
            } else {
              newFile.activeStatus = "unactive";
            }
            return newFile;
          })
        );
      }
    },
    [Files, updateFiles]
  );

  //双击打开文档并设置为选中状态
  const handleDoubleClick = useCallback(
    (item: IFile) => {
      return () => {
        //触发doubleclick
        //双击读取文件位置获取文件内容
        const currentFile = Files.find((file) => file.id === item.id);

        const uploadType = canAutoUpload();
        if (
          uploadType === "yes" &&
          currentFile?.fileQiniuStatus !== "unuploaded"
        ) {
          //访问七牛云判断是否要下载文件
          const key = currentFile?.title + ".md";
          ipcRenderer.send("qiniu-get-file-info", {
            key,
            updateTime: currentFile?.updateTime,
          });
          ipcRenderer.once(
            "qiniu-get-file-info-reply",
            (event: any, type: number) => {
              updateWhenOpenFile(currentFile as IFile, item, type > 0);
              if (type === -1) {
                dialog.showErrorBox(
                  "自动同步失败",
                  "从七牛云同步文件到本地失败,请确保网络情况良好"
                );
              } else if (type === -2) {
                console.log("本地文件是最新版本，无需从七牛云下载");
              } else if (type === -3) {
                dialog.showErrorBox(
                  "自动同步失败",
                  "获取当前文件在七牛云存储详情失败"
                );
              }
            }
          );
        } else {
          updateWhenOpenFile(currentFile as IFile, item, false);
          if (uploadType === "no") {
            dialog.showErrorBox("自动同步失败", "请确认七牛云参数设置正确");
          }
        }
      };
    },
    [Files, updateWhenOpenFile]
  );

  const deleteEmptyTitleFile = useCallback(() => {
    const newFiles = Files.filter((item) => item.title !== "");
    if (newFiles.length !== Files.length) {
      updateFiles(newFiles);
    }
  }, [updateFiles, Files]);

  const handleDelete = useCallback(
    (item: IFile, bDelteQiniu: boolean) => {
      return () => {
        //更新store
        deleteFileOnStore(item);
        //更新内存
        updateFiles(Files.filter((i) => i.id !== item.id));
        //删除本地文件
        FileHelper.deleteFile(path.join(saveLocation, item.title + ".md"));
        //如果当前文件被上传到七牛云过，则通知主线程删除七牛云文件
        //如果没有被上传过，则不删除
        if (item.fileQiniuStatus !== "unuploaded" && bDelteQiniu) {
          ipcRenderer.send("qiniu-delete-file", item.title);
        }
      };
    },
    [Files, updateFiles]
  );

  //添加上下文菜单
  const nodeRef = useContextMenu(
    [
      {
        label: "重命名",
        click: () => {
          const fileListNode = getParentNode(nodeRef.current, "file-list");
          if (fileListNode) {
            const editorFile = Files.find(
              (item) => item.id === fileListNode.dataset.id
            ) as IFile;
            //判断当前文件的acitve
            if (editorFile.saveStatus === "unsave") {
              dialog.showErrorBox("暂不可用", "当前文件未保存");
              return;
            }
            handleEditor(editorFile)();
          }
        },
      },
      {
        label: "打开",
        click: () => {
          const fileListNode = getParentNode(nodeRef.current, "file-list");
          if (fileListNode) {
            const editorFile = Files.find(
              (item) => item.id === fileListNode.dataset.id
            ) as IFile;
            handleDoubleClick(editorFile)();
          }
        },
      },
      {
        label: "删除(本地+云端)",
        click: () => {
          const fileListNode = getParentNode(nodeRef.current, "file-list");
          if (fileListNode) {
            const editorFile = Files.find(
              (item) => item.id === fileListNode.dataset.id
            ) as IFile;
            handleDelete(editorFile, true)();
          }
        },
      },
      {
        label: "删除(本地)",
        click: () => {
          const fileListNode = getParentNode(nodeRef.current, "file-list");
          if (fileListNode) {
            const editorFile = Files.find(
              (item) => item.id === fileListNode.dataset.id
            ) as IFile;
            handleDelete(editorFile, false)();
          }
        },
      },
      {
        label: "在文件夹中打开",
        click: () => {
          const fileListNode = getParentNode(nodeRef.current, "file-list");
          if (fileListNode) {
            const editorFile = Files.find(
              (item) => item.id === fileListNode.dataset.id
            ) as IFile;
            shell.showItemInFolder(
              path.join(saveLocation, editorFile.title + ".md")
            );
          }
        },
      },
    ],
    ".list-group"
  );

  //更新store和内存中文件
  const updateStoreAndFiles = useCallback(
    (
      updateFile: IFile,
      updateFileIndex: number,
      status: FileQiniuStatusType
    ) => {
      const newFile = {
        ...updateFile,
        title: editorFileTitle as string,
        fileQiniuStatus: status,
        updateTime: Date.now(),
      };
      //保存到elecrton-store中
      addFileToStore(newFile);
      //更新到内存中
      const newFiles = [...Files];
      newFiles.splice(updateFileIndex, 1, newFile);
      updateFiles(newFiles);
      setEditorFileTitle("");
      setEditorFileId(null);
    },
    [Files, editorFileTitle, updateFiles]
  );

  //文件名修改更新内存和store
  const changeFileNameRefreshStoreAndFiles = useCallback(
    (
      updateFile: IFile,
      updateFileIndex: number,
      status: FileQiniuStatusType
    ) => {
      const newFiles = [...Files];
      const newFile = {
        ...updateFile,
        title: editorFileTitle as string,
        fileQiniuStatus: status,
        updateTime: Date.now(),
      };
      //改名也需要保存到store中
      changeFileNameOnStore(newFile);
      newFiles.splice(updateFileIndex, 1, newFile);
      updateFiles(newFiles);
      setEditorFileTitle("");
      setEditorFileId(null);
    },
    [Files, editorFileTitle, updateFiles]
  );

  useEffect(() => {
    const handleInputEvent = (ev: any) => {
      const { keyCode } = ev;
      //防止editorFileId为0的情况
      if (keyCode === 27 && editorFileId !== null) {
        //esc的keycode是27
        if (
          Files[Files.findIndex((item) => item.id === editorFileId)].title ===
          ""
        ) {
          deleteEmptyTitleFile();
        }
        setEditorFileId(null);
        setEditorFileTitle("");
      }
      if (keyCode === 13 && editorFileId !== null) {
        //文件不能重名
        if (
          Files.findIndex(
            (file) => file.title === (editorFileTitle as string)
          ) >= 0
        ) {
          alert("文件名重复");
          return;
        }

        //enter的keycode是13
        const updateFileIndex = Files.findIndex(
          (item) => item.id === editorFileId
        );
        const updateFile = Files[updateFileIndex];
        const newFilePath = `${saveLocation}\\${editorFileTitle}.md`;
        const uploadType = canAutoUpload();

        //如何判断是修改文件名enter还是新增空白文件输入标题enter
        if (updateFile.title === "") {
          //新增空白文件输入标题enter,此时需要创建本地文件
          FileHelper.writeFile(newFilePath, updateFile.body)
            .then((v) => {
              //发送请求更新七牛云，只有更新到七牛云成功以后才可以更新本地
              //这个先后顺序是为了确保七牛云中putTime小于本地的updateTime
              //为什么要有这个大小，是为了如果用户在不是通过该软件而是通过其他方式修改了某个文件
              //那么putTime就会大于updateTime，本地文件应该自动从云文件中下载并同步该文件
              //更新七牛云
              if (uploadType === "yes") {
                ipcRenderer.send("qiniu-add-new-file", newFilePath);
                //监听文件上传结果，只有文件上传以后才能更新本地和store
                ipcRenderer.once(
                  "qiniu-add-new-file-reply",
                  (e: any, bSus: boolean) => {
                    //无论云同步成功或者失败，本地和store一定要更新
                    updateStoreAndFiles(
                      updateFile,
                      updateFileIndex,
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
                //如果设置不必云同步，直接更新本地和store即可
                updateStoreAndFiles(updateFile, updateFileIndex, "unuploaded");
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
        } else {
          //修改文件名enter，同步修改本地文件名
          const oriPath = `${saveLocation}\\${updateFile.title}.md`;
          FileHelper.renameFile(oriPath, newFilePath)
            .then((v) => {
              //本地文件名改完后，发送网络请求更新七牛云文件名称
              if (uploadType === "yes") {
                ipcRenderer.send("qiniu-rename-file", {
                  oriName: updateFile.title,
                  curName: editorFileTitle,
                });
                ipcRenderer.once(
                  "qiniu-rename-file-reply",
                  (e: any, bSus: boolean) => {
                    //监听回答，如果成功，那么更新本地文件和Store
                    changeFileNameRefreshStoreAndFiles(
                      updateFile,
                      updateFileIndex,
                      bSus ? "loaded-sync" : updateFile.fileQiniuStatus
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
                //直接更新本地文件即可
                changeFileNameRefreshStoreAndFiles(
                  updateFile,
                  updateFileIndex,
                  updateFile.fileQiniuStatus
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
              console.error("修改文件名失败", oriPath, newFilePath, err);
            });
        }
      }
    };
    //如果active，添加esc监听
    document.addEventListener("keyup", handleInputEvent);
    //非active取消监听
    return () => {
      document.removeEventListener("keyup", handleInputEvent);
    };
  }, [editorFileId, changeFileNameRefreshStoreAndFiles, editorFileTitle, Files, updateFiles, deleteEmptyTitleFile, updateStoreAndFiles]);

  const renderIcon = (type: FileType) => {
    switch (type) {
      case "md":
        return <FontAwesomeIcon icon={faMarkdown} />;
      case "doc":
        return <FontAwesomeIcon icon={faFileWord} />;
      case "ppt":
        return <FontAwesomeIcon icon={faFilePowerpoint} />;
      case "xls":
      case "xlsx":
        return <FontAwesomeIcon icon={faFileExcel} />;
      default:
        return <FontAwesomeIcon icon={faMarkdown} />;
    }
  };

  useEffect(() => {
    //如果文件的长度变化，那么就是新增或者删除文件
    const newFile = Files.filter((item) => item.title === "");
    if (newFile.length > 0) {
      setEditorFileId(newFile[0].id);
      setEditorFileTitle("");
    }
  }, [Files]);

  return (
    <WrapperDiv>
      <ul
        className="list-group"
        onMouseLeave={(_) => {
          //删除为title为空的File
          deleteEmptyTitleFile();
          setEditorFileId(null);
          setEditorFileTitle("");
        }}
      >
        {Files &&
          Files.map((item) => {
            return (
              <li
                style={{
                  cursor: "pointer",
                  display: item.searchShow ? "flex" : "none",
                }}
                key={item.id}
                onDoubleClick={handleDoubleClick(item)}
                className="file-list list-group-item justify-content-between flex-nowrap"
                //储存信息方便原生DOM获取
                data-id={item.id}
                data-title={item.title}
              >
                {editorFileId === item.id ? (
                  <input
                    value={editorFileTitle as string}
                    ref={inputRef}
                    placeholder="请输入文件名"
                    onChange={(e) => {
                      setEditorFileTitle(e.target.value);
                    }}
                    style={{ outline: "none", width: "80%" }}
                  />
                ) : (
                  <div>
                    {renderIcon(item.fileType)}
                    <span
                      className="name mr-1 ml-2"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      {item.title}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
      </ul>
    </WrapperDiv>
  );
});
