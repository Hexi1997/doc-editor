import { IFile, IFlattenFiles } from "../types";
/**
 * 对象数组扁平化为flatten obj，方便处理
 * @param arr 要Flatten的对象数组
 */
export const flattenArrToObj = (arr: IFile[]): IFlattenFiles => {
  return arr.reduce((map, item) => {
    map[item.id] = item;
    return map;
  }, <IFlattenFiles>{});
};
/**
 * 将flatten的obj转换为对象数组
 * @param obj flatten的obj
 */
export const objUnFlattenToArr = (obj: IFlattenFiles): IFile[] => {
  return Object.keys(obj).map((key) => obj[key]);
};
