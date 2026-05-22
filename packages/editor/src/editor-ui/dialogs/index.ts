/**
 * Editor Dialog Components
 *
 * Extracted from plugins to avoid cross-plugin imports.
 * Each dialog uses onSubmit callbacks instead of dispatching commands
 * directly, enabling clean microservice boundaries.
 */

export { InsertTableDialog } from "./insert-table-dialog"
export type { InsertTableDialogProps } from "./insert-table-dialog"

export {
  InsertImageDialog,
  InsertImageUriDialogBody,
  InsertImageUploadedDialogBody,
} from "./insert-image-dialog"
export type { InsertImagePayload } from "./insert-image-dialog"

export { InsertLayoutDialog } from "./insert-layout-dialog"
export type { InsertLayoutDialogProps, LayoutDialogValues } from "./insert-layout-dialog"

export {
  AutoEmbedDialog,
  AutoEmbedDialogStandalone,
  registerEmbedConfig,
  unregisterEmbedConfig,
  EmbedConfigs,
} from "./auto-embed-dialog"
export type { CustomEmbedConfig } from "./auto-embed-dialog"
