const fs = window.require("fs");
const FileHelper = {
  readFile: (path: string) => {
    return new Promise((resolve, reject) => {
      fs.readFile(path, { encoding: "utf-8" }, (err: any, data: unknown) => {
        if (!err) {
          resolve(data);
        } else {
          reject(err);
        }
      });
    });
  },

  deleteFile: (path: string) => {
    fs.unlink(path, (err: any) => {
      if (err) {
        console.log(err);
      }
    });
  },

  writeFile: (path: string, content: string) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(path, content, { encoding: "utf-8" }, (err: any) => {
        if (!err) {
          resolve("");
        } else {
          reject(err);
        }
      });
    });
  },

  renameFile: (path: string, newPath: string) => {
    return new Promise((resolve, reject) => {
      fs.rename(path, newPath, (err: any) => {
        if (!err) {
          resolve("");
        } else {
          reject(err);
        }
      });
    });
  },

  /**
   * 拷贝文件
   * @param oriPath 原始路径
   * @param targetPath 新路径
   */
  copyFile: (oriPath: string, targetPath: string) => {
    return new Promise((resolve, reject) => {
      fs.copyFile(oriPath, targetPath, (err: any) => {
        if (!err) {
          resolve(targetPath);
        } else {
          reject(err);
        }
      });
    });
  },
};

export default FileHelper;
