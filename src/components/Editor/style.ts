import styled from "styled-components";

const WrapperDiv = styled.div`
  position: "relative";
  .EasyMDEContainer {
    .CodeMirror {
      height: 80vh;
    }
  }
  .saveText {
    position: absolute;
    font-size: 12px;
    bottom: 8px;
    left: 3px;
    color: #aaa;
  }
`;
export default WrapperDiv;
