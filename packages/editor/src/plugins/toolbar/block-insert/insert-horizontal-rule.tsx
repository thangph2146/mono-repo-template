"use client"

import { INSERT_HORIZONTAL_RULE_COMMAND } from "@lexical/react/LexicalHorizontalRuleNode"
import { ScissorsIcon } from "lucide-react"

import { useToolbarContext } from "../../../context/toolbar-context"
import { SelectItem } from "../../../ui/select"
import { Flex } from "../../../ui/flex"
import { IconSize } from "../../../ui/typography"

export function InsertHorizontalRule() {
  const { activeEditor } = useToolbarContext()

  return (
    <SelectItem
      value="horizontal-rule"
      onPointerUp={() =>
        activeEditor.dispatchCommand(INSERT_HORIZONTAL_RULE_COMMAND, undefined)
      }
      className=""
    >
      <Flex align="center" gap={2}>
        <IconSize size="sm">
          <ScissorsIcon />
        </IconSize>
        <span>Horizontal Rule</span>
      </Flex>
    </SelectItem>
  )
}
