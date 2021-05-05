//引入qiniu的sdk
const qiniu = require("qiniu");
const path = require("path");
const axios = require("axios");
const fs = require("fs");

class QiniuManager {
  /**
   * 构造函数
   * @param {string} ak 公钥
   * @param {*} sk 私钥
   * @param {*} bucketname 桶名
   */
  constructor(ak, sk, bucketname) {
    this.bucketname = bucketname;
    //生成鉴权对象
    this.mac = new qiniu.auth.digest.Mac(ak, sk);

    //定义config,指定相关信息
    this.config = new qiniu.conf.Config();
    // 空间对应的机房，这里默认z0(华东)
    this.config.zone = qiniu.zone.Zone_z0;

    //桶管理器
    this.bucketManager = new qiniu.rs.BucketManager(this.mac, this.config);

    //cdn管理器，主要用于下载之前的刷新和预取
    this.cdnManager = new qiniu.cdn.CdnManager(this.mac);
  }

  /**
   * 自动获取当前桶的域名
   */
  getBucketDomain() {
    const reqUrl = `http://uc.qbox.me/v2/domains?tbl=${this.bucketname}`;
    const digest = qiniu.util.generateAccessToken(this.mac, reqUrl);
    return new Promise((resolve, reject) => {
      qiniu.rpc.postWithoutForm(
        reqUrl,
        digest,
        this.handleCallback(resolve, reject)
      );
    });
  }

  /**
   * 处理回调函数封装（使用高阶函数）
   * @param {*} resolve
   * @param {*} reject
   */
  handleCallback(resolve, reject) {
    return (respErr, respBody, respInfo) => {
      if (respErr) {
        reject(respErr);
      }
      if (respInfo.statusCode == 200) {
        resolve(respBody);
      } else {
        reject(respBody);
      }
    };
  }

  /**
   * 覆盖上传文件
   * @param {string} filePath 文件绝对路径
   */
  uploadFile(filePath) {
    return new Promise((resolve, reject) => {
      //根据文件路径获取文件名
      const fileName = path.basename(filePath);

      //动态生成覆盖上传凭证
      const options = {
        scope: `${this.bucketname}:${fileName}`,
        expires: 0,
      };
      const putPolicy = new qiniu.rs.PutPolicy(options);
      const uploadToken = putPolicy.uploadToken(this.mac);

      //执行上传
      const formUploader = new qiniu.form_up.FormUploader(this.config);
      const putExtra = new qiniu.form_up.PutExtra();
      formUploader.putFile(
        uploadToken,
        fileName,
        filePath,
        putExtra,
        this.handleCallback(resolve, reject)
      );
    });
  }

  /**
   * 批量上传文件
   * @param {string[]} paths 要上传的文件路径数组
   */
  batchUploadFile(paths) {
    return new Promise((resolve, reject) => {
      const promises = [];
      paths.forEach((path) => {
        promises.push(this.uploadFile(path));
      });
      Promise.all(promises)
        .then((v) => {
          resolve(v);
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  //数组分割
  group(array, subGroupLength) {
    let index = 0;
    let newArray = [];
    while (index < array.length) {
      newArray.push(array.slice(index, (index += subGroupLength)));
    }
    return newArray;
  }

  /**
   * 刷新多个文件
   * @param {string} urlArr 要刷新的文件网址
   */
  refreshFiles(urlArr) {
    return new Promise((resolve, reject) => {
      const arrSplit = this.group(urlArr, 100);

      const promises = arrSplit.map((arr) => {
        return new Promise((resolve, reject) => {
          this.cdnManager.refreshUrls(
            arr,
            this.handleCallback(resolve, reject)
          );
        });
      });

      Promise.all(promises)
        .then((values) => {
          console.log("刷新成功", values);
          resolve(values);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * 生成下载链接
   * @param {string} key 要下载的文件名
   */
  generateDownloadLink(key) {
    return new Promise((resolve, reject) => {
      if (this.domain) {
        resolve(this.bucketManager.publicDownloadUrl(this.domain, key));
      } else {
        this.getBucketDomain()
          .then((domain) => {
            if (domain) {
              //获取到了域名
              this.domain = `http://${domain}`;
              resolve(this.bucketManager.publicDownloadUrl(this.domain, key));
            } else {
              reject("获取当前桶域名失败，请确认是否过期");
            }
          })
          .catch(reject);
      }
    });
  }

  /**
   * 下载文件到本地
   * @param {string} key 要下载的文件名
   * @param {string} savePath 保存路径(不包含文件名)
   * @param {boolean} bRefreshFile 是否刷新文件后再下载（默认false)
   */
  downloadFile(key, savePath, bRefreshFile = false) {
    return new Promise((resolve, reject) => {
      //1、生成下载地址
      let fileUrl = "";
      this.generateDownloadLink(key)
        .then((url) => {
          //2、使用axios发送可读流
          // const timeStamp = new Date().getTime();
          //加时间戳避免缓存（不管用，需要访问代码进行刷新）
          // const link = `${url}?timestamp=${timeStamp}`;

          //2、刷新当前文件，否则有可能下载到缓存的文件
          fileUrl = url;
          if (bRefreshFile) {
            return this.refreshFiles([url]);
          } else {
            return Promise.resolve("");
          }
        })
        .then((v) => {
          bRefreshFile && console.log("刷新文件成功");
          fileUrl = `${fileUrl}?v=${new Date().getTime()}`;
          console.log("开始下载", fileUrl);
          //2.5、网络请求获取
          return axios({
            url: fileUrl,
            method: "GET",
            //设置返回类型为stream
            responseType: "stream",
            //避免缓存
            headers: { "Cache-Control": "no-cache" },
          });
        })
        .then((response) => {
          //路径兼容性处理
          savePath = savePath.trimEnd("/").trimEnd("\\") + "\\" + key;
          const writer = fs.createWriteStream(savePath);
          //写入本地文件
          console.log(typeof response.data);
          response.data.pipe(writer);
          //完成resolve,失败reject
          writer.on("finish", () => {
            console.log("写入本地文件成功");
            resolve(savePath);
          });
          writer.on("error", reject);
        })
        .catch(reject);
    });
  }

  /**
   * 文件重命名
   * @param {string} originName 原始文件名
   * @param {string} currentName 目标文件名
   */
  renameFile(originName, currentName) {
    return new Promise((resolve, reject) => {
      this.bucketManager.move(
        this.bucketname,
        originName,
        this.bucketname,
        currentName,
        { force: true },
        this.handleCallback(resolve, reject)
      );
    });
  }

  /**
   * 删除文件
   * @param {string} key 文件名
   */
  deleteFile(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.delete(
        this.bucketname,
        key,
        this.handleCallback(resolve, reject)
      );
    });
  }

  /**
   * 获取文件信息
   * @param {string} key 文件名
   */
  getFileInfo(key) {
    return new Promise((resolve, reject) => {
      this.bucketManager.stat(
        this.bucketname,
        key,
        this.handleCallback(resolve, reject)
      );
    });
  }
}

module.exports = {
  QiniuManager,
};
