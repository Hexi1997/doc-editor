import { useEffect } from "react";
const { ipcRenderer } = window.require("electron");

type KeyCallbackType = {
  [key: string]: Function;
};
const useIpcRenderer = (keyAndCallBackMap: KeyCallbackType) => {
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
