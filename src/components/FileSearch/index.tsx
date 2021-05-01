import React, {
  memo,
  useRef,
  useState,
  useEffect,
  FormEvent,
  useCallback,
} from "react";
import { faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface IProps {
  searchFiles: (txt: string) => void;
}

export default memo(function FileSearch({ searchFiles }: IProps) {
  const [value, setValue] = useState("");
  const [active, setActive] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const quitSearch = useCallback(() => {
    setActive(false);
    setValue("");
    searchFiles("");
  }, [searchFiles]);
  useEffect(() => {
    const handleInputEvent = (ev: any) => {
      const { keyCode } = ev;
      if (keyCode === 27 && active) {
        //esc的keycode是27
        quitSearch();
      }
      if (keyCode === 13 && active) {
        //enter的keycode是13
        searchFiles(inputRef.current?.value as string);
        // console.log("应该执行文件查询", inputRef.current?.value);
      }
    };
    //如果active，添加esc监听
    document.addEventListener("keyup", handleInputEvent);
    //非active取消监听
    return () => {
      document.removeEventListener("keyup", handleInputEvent);
    };
  }, [active, searchFiles, quitSearch]);

  return (
    <div
      className="pl-2 pr-2"
      style={{
        backgroundColor: "#98dbd2",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "1rem",
        height: "2rem",
      }}
    >
      {!active && <span className="title">我的云文档</span>}
      <input
        value={value}
        ref={inputRef}
        onChange={(e: FormEvent<HTMLInputElement>) =>
          setValue((e.target as HTMLInputElement).value)
        }
        onBlur={(_) => {
          //触发onBlur
          // quitSearch();
        }}
        style={{
          height: "1.4rem",
          width: "80%",
          display: active ? "block" : "none",
          fontSize: "0.8rem",
          paddingLeft: ".2rem",
          outline: "none",
        }}
      />
      {!active && (
        <FontAwesomeIcon
          style={{ width: "1.1rem", height: "1.1rem" }}
          icon={faSearch}
          onClick={(_) => {
            //定时器中让setActive让input组件渲染完毕，然后才可以成功执行focus
            setTimeout(() => {
              setActive(true);
              inputRef.current?.focus();
            }, 0);
          }}
        />
      )}
      {active && (
        <FontAwesomeIcon
          style={{ width: "1.3rem", height: "1.3rem" }}
          icon={faTimes}
          onClick={(_) => {
            quitSearch();
          }}
        />
      )}
    </div>
  );
});
