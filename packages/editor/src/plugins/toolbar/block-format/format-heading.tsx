import { $createHeadingNode, HeadingTagType } from "@lexical/rich-text"
import { $setBlocksType } from "@lexical/selection"
import { $getSelection } from "lexical"

import { useToolbarContext } from "../../../context/toolbar-context"
import { blockTypeToBlockName } from "../../../plugins/toolbar/block-format/block-format-data"
import { SelectItem } from "../../../ui/select"
import { Flex } from "../../../ui/flex"

export function FormatHeading({ levels = [] }: { levels: HeadingTagType[] }) {
  const { activeEditor, blockType } = useToolbarContext()

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      activeEditor.update(() => {
        const selection = $getSelection()
        $setBlocksType(selection, () => $createHeadingNode(headingSize))
      })
    }
  }

  return levels.map((level) => (
    <SelectItem
      key={level}
      value={level}
      onPointerDown={() => formatHeading(level)}
    >
      <Flex align="center" gap={2}>
        {blockTypeToBlockName[level]?.icon}
        {blockTypeToBlockName[level]?.label}
      </Flex>
    </SelectItem>
  ))
}
