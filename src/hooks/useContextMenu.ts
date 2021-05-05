import { useEffect, useRef } from "react";
const { remote } = window.require("electron");
const { Menu, MenuItem } = remote;
const useContextMenu = (menuItems: any, querySelectorString: string) => {
  const ref = useRef();
  useEffect(() => {
    const menu = new Menu();
    menuItems.forEach((item: any) => {
      menu.append(new MenuItem(item));
    });

    const handleContextMenu = (e: any) => {
      ref.current = e.target;
      if (document.querySelector(querySelectorString)?.contains(e.target)) {
        menu.popup({ window: remote.getCurrentWindow() });
      }
    };
    window.addEventListener("contextmenu", handleContextMenu);
    return () => {
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [menuItems, querySelectorString]);
  return ref;
};

export default useContextMenu;
