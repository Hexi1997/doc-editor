import FileHelper from "./fileHelper";
import { saveLocation } from "./storeUtils";
const { basename, join } = window.require("path");
const LuckyExcel = require("luckyexcel");

/**
 * luckysheet容器名
 */
export const SheetContainerName = "luckysheet";

/**
 * data转luckysheet
 * @param data 通过fs.readFile读取的data
 */
export const convertDataToLuckySheetJson = (data: any) => {
  return new Promise((resolve, reject) => {
    try {
      LuckyExcel.transformExcelToLucky(data, (exportJson: any) => {
        resolve(exportJson);
      });
    } catch (error) {
      reject(error);
    }
  });
};

const getOptionFromExportJson = (exportJson: any, title: string) => {
  return {
    title,
    lang: "zh",
    container: SheetContainerName,
    data: exportJson.sheets,
    showinfobar: false,
  };
};

/**
 * 通过文件路径导入xlsx文件,并且复制到指定目录，
 * @param xlsxPath xlsx文件路径
 */
export const importAndCopyXlsxByPath = (xlsxPath: string) => {
  return new Promise((resolve, reject) => {
    let savePath = "";

    FileHelper.readFile(xlsxPath, true)
      .then((v) => {
        //第一步：读取文件内容（二进制）并且转换成luckysheet的格式
        return convertDataToLuckySheetJson(v);
      })
      .then((v) => {
        //第二步：提取option并且保存到指定路径
        //文件名称提取
        const title = basename(xlsxPath, ".xlsx");
        //保存文件路径，保存到默认路径txt文件中
        savePath = join(saveLocation, `${title}.xlsx`);
        //提取option
        const option = getOptionFromExportJson(v, title);
        //将option转换为字符串保存在txt中
        return FileHelper.writeFile(savePath, JSON.stringify(option));
      })
      .then((v) => {
        //写入成功后保存文件返回文件路径
        resolve(savePath);
      })
      .catch(reject);
  });
};
