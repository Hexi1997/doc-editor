import { useEffect } from "react";
const { ipcRenderer } = window.require("electron");

type KeyCallbackType = {
  [key: string]: () => void;
};
const useIpcRenderer = (keyAndCallBackMap: KeyCallbackType) => {
  console.log("进入useIpcRenderer");
  useEffect(() => {
    Object.keys(keyAndCallBackMap).forEach((key) => {
      ipcRenderer.on(key, keyAndCallBackMap[key]);
    });
    return () => {
      Object.keys(keyAndCallBackMap).forEach((key) => {
        ipcRenderer.removeListener(key, keyAndCallBackMap[key]);
      });
    };
  }, [keyAndCallBackMap]);
};

export default useIpcRenderer;
