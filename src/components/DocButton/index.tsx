import { faFileImport, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { memo, useCallback } from "react";
import { ButtonType, IFile } from "../../types";
import { v4 as uuid } from "uuid";

interface IProps {
  type: ButtonType;
  addFile: (newFile: IFile) => void;
}

export default memo(function DocButton({ type, addFile }: IProps) {
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

  const handleClick = useCallback(() => {
    //根据点击类型执行不同操作
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
      };
      addFile(newFile);
    } else if (type === "import") {
      //导入，渲染进程使用remote打开对话框
      window.require("elecrton").remote.dialog.showOpenDialog(
        {
          title: "选择导入的markdown文件",
          properties: ["openfile", "multiSelections"],
          filters: [{ name: "Markdown files", extensions: ["md"] }],
        },
        (paths: any) => {
          console.log(paths);
        }
      );
    }
  }, [addFile, type]);
  return (
    <button
      onClick={handleClick}
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
