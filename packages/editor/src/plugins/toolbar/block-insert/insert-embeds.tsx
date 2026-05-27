"use client"

import { useToolbarContext } from "../../../context/toolbar-context"
import {
  AutoEmbedDialogStandalone,
  CustomEmbedConfig,
  EmbedConfigs,
} from "../../../editor-ui/dialogs"
import { SelectItem } from "../../../ui/select"
import { Flex } from "../../../ui/flex"

export function InsertEmbeds() {
  const { activeEditor, showModal } = useToolbarContext()
  return EmbedConfigs.map((embedConfig: CustomEmbedConfig) => (
    <SelectItem
      key={embedConfig.type}
      value={embedConfig.type}
      onPointerUp={() => {
        showModal(`Embed ${embedConfig.contentName}`, (onClose) => (
          <AutoEmbedDialogStandalone
            embedConfig={embedConfig}
            onClose={onClose}
            editor={activeEditor}
          />
        ))
      }}
      className=""
    >
      <Flex align="center" gap={2}>
        {embedConfig.icon}
        <span>{embedConfig.contentName}</span>
      </Flex>
    </SelectItem>
  ))
}
