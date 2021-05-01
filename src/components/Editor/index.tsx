import React, { LegacyRef, memo, useCallback, useRef } from "react";
import SimpleMDEEditor from "react-simplemde-editor";
import "easymde/dist/easymde.min.css";
import WrapperDiv from "./style";
import { IFile } from "../../types";
import FileHelper from "../../utils/fileHelper";
import { saveLocation } from "../../utils/storeUtils";
const path = window.require("path");

interface IProps {
  Files: IFile[];
  updateFiles: (newFile: IFile[]) => void;
}
export default memo(function Editor({ Files, updateFiles }: IProps) {
  const openFiles = Files.filter((item) => item.openStatus === true);
  const activeFiles = Files.filter((item) => item.activeStatus === "active");
  const activeFileBody = activeFiles.length > 0 ? activeFiles[0].body : "";

  const ref = useRef<SimpleMDEEditor>();

  //内容改变事件
  const handleChange = useCallback(
    (value: string) => {
      setTimeout(() => {
        console.log(value);
        //更新到服务器当前内容
        updateFiles(
          Files.map((file) => {
            if (file.id === activeFiles[0].id) {
              file.body = value;
              file.saveStatus = "unsave";
            }
            return file;
          })
        );
      }, 0);
    },
    [Files, activeFiles, updateFiles]
  );

  //定义Ctrl-S保存快捷键
  const genExtraKeys = useCallback(
    () => ({
      "Ctrl-S": function (cm: any) {
        setTimeout(() => {
          console.log("ctrl+s", cm);
          //保存当前值到本地文件
          const location = path.join(
            saveLocation,
            activeFiles[0].title + ".md"
          );
          FileHelper.writeFile(location, activeFiles[0].body)
            .then((v) => {
              console.log("成功保存到本地");
              //更新内存中unsave状态
              updateFiles(
                Files.map((item) => {
                  const newItem = { ...item };
                  if (item.id === activeFiles[0].id) {
                    newItem.saveStatus = "saved";
                    newItem.body = ref.current?.state.value as string;
                    console.log(newItem);
                  }
                  return newItem;
                })
              );
            })
            .catch((err) => {
              console.error(err);
            });
        }, 500);
      },
    }),
    [Files, activeFiles, updateFiles]
  );

  if (openFiles.length === 0) {
    return (
      <h3 style={{ color: "#ccc", textAlign: "center", marginTop: "6rem" }}>
        请选择或创建 MarkDown 文档
      </h3>
    );
  }

  if (activeFiles.length === 0) {
    return <></>;
  }

  return (
    <WrapperDiv>
      <SimpleMDEEditor
        ref={ref as LegacyRef<SimpleMDEEditor>}
        id={activeFiles[0].id}
        key={activeFiles[0].id}
        value={activeFileBody}
        onChange={handleChange}
        extraKeys={genExtraKeys()}
      />
    </WrapperDiv>
  );
});
