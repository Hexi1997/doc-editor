import { faMarkdown } from "@fortawesome/free-brands-svg-icons";
import {
  faFileExcel,
  faFilePowerpoint,
  faFileWord,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import WrapperDiv from "./style";
import { FileType, IFile } from "../../types";
import FileHelper from "../../utils/fileHelper";
import {
  addFileToStore,
  changeFileNameOnStore,
  deleteFileOnStore,
  saveLocation,
} from "../../utils/storeUtils";
const path = window.require("path");

interface IProps {
  Files: IFile[];
  updateFiles: (newFile: IFile[]) => void;
}
export default memo(function FileList({ Files, updateFiles }: IProps) {
  const [hoverFileId, setHoverFileId] = useState<null | string>(null);
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

  //双击打开文档并设置为选中状态
  const handleDoubleClick = useCallback(
    (item: IFile) => {
      return () => {
        //触发doubleclick
        //双击读取文件位置获取文件内容
        const currentFile = Files.find((file) => file.id === item.id);

        //如果当前文件的body为""，需要读取本地文件获取内容
        if (currentFile?.body === "") {
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
      };
    },
    [Files, updateFiles]
  );

  const deleteEmptyTitleFile = useCallback(() => {
    const newFiles = Files.filter((item) => item.title !== "");
    updateFiles(newFiles);
  }, [updateFiles, Files]);

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
        //如何判断是修改文件名enter还是新增空白文件输入标题enter
        if (updateFile.title === "") {
          //新增空白文件输入标题enter,此时需要创建本地文件
          FileHelper.writeFile(newFilePath, updateFile.body)
            .then((v) => {
              console.log(v, "创建本地文件成功", newFilePath);
              const newFile = {
                ...updateFile,
                title: editorFileTitle as string,
              };
              //保存到elecrton-store中
              addFileToStore(newFile);
              //更新到内存中
              const newFiles = [...Files];
              newFiles.splice(updateFileIndex, 1, newFile);
              updateFiles(newFiles);
              setEditorFileTitle("");
              setEditorFileId(null);
            })
            .catch((err) => {
              console.error(err);
            });
        } else {
          //修改文件名enter，同步修改本地文件名
          const oriPath = `${saveLocation}\\${updateFile.title}.md`;
          FileHelper.renameFile(oriPath, newFilePath)
            .then((v) => {
              const newFiles = [...Files];
              const newFile = {
                ...updateFile,
                title: editorFileTitle as string,
              };
              //改名也需要保存到store中
              changeFileNameOnStore(newFile);
              newFiles.splice(updateFileIndex, 1, newFile);

              updateFiles(newFiles);
              setEditorFileTitle("");
              setEditorFileId(null);
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
  }, [editorFileId, editorFileTitle, Files, updateFiles, deleteEmptyTitleFile]);

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
          setHoverFileId(null);
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
                // onMouseLeave={(_) => {
                //   setEditorFileId(null);
                //   setEditorFileTitle("");
                // }}
                onMouseEnter={(_) => setHoverFileId(item.id)}
                onDoubleClick={handleDoubleClick(item)}
                className="file-list list-group-item justify-content-between flex-nowrap"
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

                <div
                  className={
                    item.id === hoverFileId && item.id !== editorFileId
                      ? "d-flex"
                      : "d-none"
                  }
                >
                  <button
                    type="button"
                    onClick={handleEditor(item)}
                    className="btn btn-primary mr-1 rounded-sm"
                    style={{ padding: ".2rem", fontSize: "0.8rem" }}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={(_) => {
                      //更新store
                      deleteFileOnStore(item);
                      //更新内存
                      updateFiles(Files.filter((i) => i.id !== item.id));
                      //删除本地文件
                      FileHelper.deleteFile(
                        path.join(saveLocation, item.title + ".md")
                      );
                    }}
                    className="btn btn-danger rounded-sm"
                    style={{ padding: ".2rem", fontSize: "0.8rem" }}
                  >
                    删除
                  </button>
                </div>
              </li>
            );
          })}
      </ul>
    </WrapperDiv>
  );
});
