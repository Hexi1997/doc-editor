import styled from "styled-components";
const WrapperDiv = styled.div`
  flex: 1;
  overflow: auto;
  border: 1px solid #ddd;
  .file-list {
    &:hover {
      background-color: #eee;
    }
  }
`;

export default WrapperDiv;
