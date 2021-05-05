const path = require("path");
const { QiniuManager } = require("./qiniuManager");

const manager = new QiniuManager(
  "C6UvaUyTA4T43a4CeZFcUM-gOmE5bQlbbMbEvcep",
  "kDgqCo8wYzn9O5uoebZe7t-lT6M-yec-IY6hjjCM",
  "md-editor"
);
// manager
//   .getFileInfo("test.md")
//   .then((v) => {
//     console.log(v);
//   })
//   .catch((e) => {
//     console.error(e);
//   });
// manager
//   .deleteFile("test4.md")
//   .then((v) => {
//     console.log("删除成功", v);
//   })
//   .catch((e) => {
//     console.log("删除失败", e);
//   });
// manager.renameFile("test3.md", "test4.md").then(
//   (v) => {
//     console.log("修改成功");
//   },
//   (e) => {
//     console.error(e);
//   }
// );
// manager
//   .downloadFile("test.md", __dirname, true)
//   .then((v) => {
//     console.log(v);
//   })
//   .catch((e) => {
//     console.error("下载该文件失败", e);
//   });
// manager
//   .generateDownloadLink("test.md")
//   .then((v) => {
//     console.log(v);
//   })
//   .catch((err) => {
//     console.error(err);
//   });
// manager.getBucketDomain().then(
//   (v) => {
//     console.log(v);
//   },
//   (err) => {
//     console.error(err);
//   }
// );
manager.uploadFile(path.resolve(__dirname, "test.md")).then(
  (v) => {
    console.log(v);
  },
  (err) => {
    console.error(err);
  }
);
