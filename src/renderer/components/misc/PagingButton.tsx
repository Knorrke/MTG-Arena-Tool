import styled from "styled-components";
import indexCss from "../../index.css";

interface PagingButtonProps {
  selected?: boolean;
}

const PagingButtonBase = styled.button.attrs<PagingButtonProps>((props) => ({
  className: `${props.className ?? ""} ${
    props.disabled ? indexCss.pagingButtonDisabled : indexCss.pagingButton
  } ${props.selected ? indexCss.pagingActive : ""}`,
}))`
  min-width: 30px;
`;

export const PagingButton = styled(PagingButtonBase)<PagingButtonProps>``;
