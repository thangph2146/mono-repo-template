import { INSERT_CHECK_LIST_COMMAND, REMOVE_LIST_COMMAND } from "@lexical/list"
import { useToolbarContext } from "../../../context/toolbar-context"
import { blockTypeToBlockName } from "../../../plugins/toolbar/block-format/block-format-data"
import { SelectItem } from "../../../ui/select"
import { Flex } from "../../../ui/flex"

const BLOCK_FORMAT_VALUE = "check"

export function FormatCheckList() {
  const { activeEditor, blockType } = useToolbarContext()

  const formatParagraph = () => {
    activeEditor.dispatchCommand(REMOVE_LIST_COMMAND, undefined)
  }

  const formatCheckList = () => {
    if (blockType !== "check") {
      activeEditor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
    } else {
      formatParagraph()
    }
  }

  return (
    <SelectItem value={BLOCK_FORMAT_VALUE} onPointerDown={formatCheckList}>
      <Flex align="center" gap={2}>
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE]?.icon}
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE]?.label}
      </Flex>
    </SelectItem>
  )
}
