import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import React, { memo, useCallback, useState, useEffect } from "react";
import { IFile } from "../../types";
import WrapperUl from "./style";
import { faCircle, faTimes } from "@fortawesome/free-solid-svg-icons";

interface IProps {
  Files: IFile[];
  updateFiles: (newFiles: IFile[]) => void;
}
let beforeLength = 0;
export default memo(function TabNav({ Files, updateFiles }: IProps) {
  //筛选出active的数据
  const openFiles = Files.filter((item) => item.openStatus === true);
  //hover状态
  const [hoverFileId, setHoverFileId] = useState<string | null>(null);

  //监听文件新增和关闭事件
  useEffect(() => {
    if (beforeLength === 0 || beforeLength === openFiles.length) {
      beforeLength = openFiles.length;
      return;
    } else if (beforeLength > openFiles.length) {
      //关闭
      //如果没有activeFiles，那么默认最后一位
      //如果有activeFiles，那么不变
      const activeFiles = openFiles.filter(
        (item) => item.activeStatus === "active"
      );
      if (activeFiles.length === 0) {
        //修改最后一位的activeStatus
        if (openFiles.length === 0) {
          //最后一个文档被关闭，重置数字
          beforeLength = 0;
          return;
        }
        debugger;
        const activeId = openFiles[openFiles.length - 1].id;
        const newFiles = [...Files];
        newFiles.forEach((file) => {
          if (file.id === activeId) {
            file.activeStatus = "active";
          }
        });
        updateFiles(newFiles);
      }
    } else {
      //新增
    }
    beforeLength = openFiles.length;
  }, [openFiles, Files, updateFiles]);

  //关闭tab点击事件
  const handleClose = useCallback(
    (item: IFile) => {
      return () => {
        //执行关闭tab
        if (item.saveStatus === "saved") {
          //已保存的文件可以关闭,更新当前item的openStatus
          const newFiles = [...Files];
          newFiles[
            newFiles.findIndex((file) => file.id === item.id)
          ].openStatus = false;
          updateFiles(newFiles);
        } else {
          alert("请先保存");
        }
      };
    },
    [Files, updateFiles]
  );

  return (
    <WrapperUl className="nav nav-pills border-bottom border-top">
      {/* <li className="nav-item">
          <a className="nav-link active" href="todo">
            Active
          </a>
        </li> */}
      {openFiles.map((item) => {
        return (
          <li
            key={item.id}
            onMouseEnter={(_) => {
              setHoverFileId(item.id);
            }}
            onMouseLeave={(_) => {
              setHoverFileId(null);
            }}
            onClick={(_) => {
              //更新activeStatus
              const newFiles = Files.map((file) => {
                const newFile = { ...file };
                if (newFile.id === item.id) {
                  newFile.activeStatus = "active";
                } else {
                  newFile.activeStatus = "unactive";
                }
                return newFile;
              });
              updateFiles(newFiles);
            }}
            style={{
              cursor: "pointer",
            }}
            className={classNames([
              "nav-item",
              "border-right",
              "d-flex",
              {
                "bg-primary": item.activeStatus === "active",
              },
              "align-items-center",
              {
                "tabbar-hover": hoverFileId === item.id,
              },
            ])}
          >
            <div
              className={
                "rounded-0 nav-link " +
                (item.activeStatus === "active" ? "active" : "")
              }
            >
              {item.title}
            </div>
            {/* 关闭 */}
            <FontAwesomeIcon
              className="mr-2 ml-0"
              onClick={handleClose(item)}
              icon={faTimes}
              style={{
                cursor: "pointer",
                color: "#ccc",
                display: item.id === hoverFileId ? "block" : "none",
              }}
            />
            {/* 保存 */}
            <FontAwesomeIcon
              className="mr-2 ml-0"
              icon={faCircle}
              style={{
                fontSize: "0.8rem",
                cursor: "pointer",
                color: "#ccc",
                display:
                  item.id !== hoverFileId && item.saveStatus === "unsave"
                    ? "block"
                    : "none",
              }}
            />
          </li>
        );
      })}
    </WrapperUl>
  );
});
