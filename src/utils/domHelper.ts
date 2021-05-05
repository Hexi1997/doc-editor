/**
 * 逐层向上寻找指定类名父节点(一般用于点击事件的冒泡到指定父元素)
 * @param node 当前节点
 * @param parentClsName 要寻找的父节点的唯一类名
 */
export const getParentNode = (node: any, parentClsName: string) => {
  let current = node;
  while (current !== null) {
    if (current.classList.contains(parentClsName)) {
      return current;
    }
    current = current.parentNode;
  }
  return false;
};
