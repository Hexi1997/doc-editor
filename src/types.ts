export interface IFile {
  /**
   * id字符串
   */
  id: string;
  /**
   * 文件内容
   */
  body: string;
  /**
   * 文件名
   */
  title: string;
  /**
   * 文件创建时间戳
   */
  createAt: number;
  /**
   * 文件类型
   */
  fileType: FileType;
  /**
   * 是否已经在tab面板中打开
   */
  openStatus: boolean;
  /**
   * 是否是tab面板中正在编辑的文档，是则active，否则unactive
   */
  activeStatus: ActiveStatus;
  /**
   * 保存状态，编辑的文档内容是否保存，默认为false，一旦内容变化，则为true
   */
  saveStatus: SaveStatus;
  /**
   * 搜索状态，为true则显示，为false则不显示，默认为true
   */
  searchShow: boolean;
}

export interface IFlattenFiles {
  [propsName: string]: IFile;
}
export type ActiveStatus = "active" | "unactive";
export type SaveStatus = "unsave" | "saved";
export type FileType = "md" | "doc" | "xls" | "xlsx" | "ppt";

export type ButtonType = "import" | "new";
