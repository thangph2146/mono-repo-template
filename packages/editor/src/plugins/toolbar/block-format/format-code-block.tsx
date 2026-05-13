import { $createCodeNode } from "@lexical/code"
import { $setBlocksType } from "@lexical/selection"
import { $getSelection, $isRangeSelection } from "lexical"

import { useToolbarContext } from "../../../context/toolbar-context"
import { blockTypeToBlockName } from "../../../plugins/toolbar/block-format/block-format-data"
import { SelectItem } from "../../../ui/select"
import { Flex } from "../../../ui/flex"

const BLOCK_FORMAT_VALUE = "code"

export function FormatCodeBlock() {
  const { activeEditor, blockType } = useToolbarContext()

  const formatCode = () => {
    if (blockType !== "code") {
      activeEditor.update(() => {
        let selection = $getSelection()

        if (selection !== null) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection, () => $createCodeNode())
          } else {
            const textContent = selection.getTextContent()
            const codeNode = $createCodeNode()
            selection.insertNodes([codeNode])
            selection = $getSelection()
            if ($isRangeSelection(selection)) {
              selection.insertRawText(textContent)
            }
          }
        }
      })
    }
  }

  return (
    <SelectItem value={BLOCK_FORMAT_VALUE} onPointerDown={formatCode}>
      <Flex align="center" gap={2}>
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE]?.icon}
        {blockTypeToBlockName[BLOCK_FORMAT_VALUE]?.label}
      </Flex>
    </SelectItem>
  )
}
