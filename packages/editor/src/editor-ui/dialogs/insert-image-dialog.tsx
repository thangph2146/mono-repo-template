"use client"

/**
 * Insert Image Dialog Components
 *
 * Extracted from images-plugin.tsx to avoid cross-plugin imports.
 * Consumed by: toolbar/block-insert, picker/image-picker, images-plugin
 *
 * Design: Dialog accepts onSubmit callback instead of dispatching commands
 * directly, avoiding circular dependencies with images-plugin.
 */
import { JSX, useState } from "react"

import { Button } from "../../ui/button"
import { DialogFooter } from "../../ui/dialog"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs"
import { logger } from "../../lib/logger"
import { TypographySpanSmallMuted } from "../../ui/typography"

const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024

export type InsertImagePayload = Readonly<{
  altText: string
  src: string
}>

type InsertImageDialogProps = {
  onSubmit: (payload: InsertImagePayload) => void
  onClose: () => void
  activeTab?: string
  initialValues?: { src?: string; altText?: string }
  confirmLabel?: string
}

// ─── URI Dialog Body ───────────────────────────────────────────────

export function InsertImageUriDialogBody({
  onSubmit,
  initialSrc = "",
  initialAltText = "",
  confirmLabel = "Confirm",
}: {
  onSubmit: (payload: InsertImagePayload) => void
  initialSrc?: string
  initialAltText?: string
  confirmLabel?: string
}): JSX.Element {
  const [src, setSrc] = useState(initialSrc)
  const [altText, setAltText] = useState(initialAltText)
  const normalizedSrc = src.trim()
  const canPreview =
    /^https?:\/\//i.test(normalizedSrc) ||
    normalizedSrc.startsWith("/api/uploads")

  const isDisabled = src === ""

  return (
    <div className="editor-form-grid">
      <div className="editor-form-item">
        <Label htmlFor="image-url">Image URL</Label>
        <Input
          id="image-url"
          placeholder="i.e. https://source.unsplash.com/random"
          onChange={(e) => setSrc(e.target.value)}
          value={src}
          data-test-id="image-modal-url-input"
        />
      </div>
      <div className="editor-form-item">
        <Label htmlFor="alt-text">Alt Text</Label>
        <Input
          id="alt-text"
          placeholder="Descriptive alternative text"
          onChange={(e) => setAltText(e.target.value)}
          value={altText}
          data-test-id="image-modal-alt-text-input"
        />
      </div>
      {canPreview ? (
        <div className="editor-form-item">
          <Label>Xem trước</Label>
          <div className="editor-image-preview">
            <img
              src={normalizedSrc}
              alt={altText || "image-preview-url"}
              className="editor-image-preview__image"
            />
          </div>
        </div>
      ) : null}
      <DialogFooter>
        <Button
          type="submit"
          disabled={isDisabled}
          onClick={() => {
            logger.debug("[InsertImageDialog] Confirm image byURL", {
              srcType: normalizedSrc.startsWith("/api/uploads")
                ? "uploads"
                : "url",
              hasAltText: Boolean(altText.trim()),
            })
            onSubmit({ altText, src })
          }}
          data-test-id="image-modal-confirm-btn"
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─── Upload Dialog Body ────────────────────────────────────────────

export function InsertImageUploadedDialogBody({
  onSubmit,
  initialSrc = "",
  initialAltText = "",
  confirmLabel = "Confirm",
}: {
  onSubmit: (payload: InsertImagePayload) => void
  initialSrc?: string
  initialAltText?: string
  confirmLabel?: string
}): JSX.Element {
  const [src, setSrc] = useState(
    initialSrc.startsWith("data:") ? initialSrc : ""
  )
  const [altText, setAltText] = useState(initialAltText)
  const [uploadError, setUploadError] = useState("")

  const isDisabled = src === ""

  const loadImage = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setUploadError("Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.")
      setSrc("")
      return
    }

    setUploadError("")
    const reader = new FileReader()
    reader.onload = function () {
      if (typeof reader.result === "string") {
        setSrc(reader.result)
      }
      return ""
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="editor-form-grid">
      <div className="editor-form-item">
        <Label htmlFor="image-upload">Image Upload</Label>
        <Input
          id="image-upload"
          type="file"
          onChange={(e) => loadImage(e.target.files)}
          accept="image/*"
          data-test-id="image-modal-file-upload"
        />
        {uploadError ? (
          <TypographySpanSmallMuted className="editor-text-destructive">
            {uploadError}
          </TypographySpanSmallMuted>
        ) : (
          <TypographySpanSmallMuted>
            Dung lượng tối đa: 5MB
          </TypographySpanSmallMuted>
        )}
      </div>
      <div className="editor-form-item">
        <Label htmlFor="alt-text">Alt Text</Label>
        <Input
          id="alt-text"
          placeholder="Descriptive alternative text"
          onChange={(e) => setAltText(e.target.value)}
          value={altText}
          data-test-id="image-modal-alt-text-input"
        />
      </div>
      {src.trim() ? (
        <div className="editor-form-item">
          <Label>Xem trước</Label>
          <div className="editor-image-preview">
            <img
              src={src.trim()}
              alt={altText || "image-preview-file"}
              className="editor-image-preview__image"
            />
          </div>
        </div>
      ) : null}
      <DialogFooter>
        <Button
          type="submit"
          disabled={isDisabled}
          onClick={() => {
            logger.debug("[InsertImageDialog] Confirm image by file/base64", {
              hasBase64: src.trim().startsWith("data:"),
              hasAltText: Boolean(altText.trim()),
            })
            onSubmit({ altText, src })
          }}
          data-test-id="image-modal-file-upload-btn"
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </div>
  )
}

// ─── Main Dialog ───────────────────────────────────────────────────

export function InsertImageDialog({
  onSubmit,
  onClose,
  activeTab = "url",
  initialValues,
  confirmLabel = "Confirm",
}: InsertImageDialogProps): JSX.Element {
  const handleSubmit = (payload: InsertImagePayload) => {
    onSubmit(payload)
    onClose()
  }

  return (
    <Tabs defaultValue={activeTab}>
      <TabsList className="editor-tabs-list">
        <TabsTrigger value="url" className="editor-tabs-trigger">
          URL
        </TabsTrigger>
        <TabsTrigger value="file" className="editor-tabs-trigger">
          File
        </TabsTrigger>
      </TabsList>
      <TabsContent value="url">
        <InsertImageUriDialogBody
          onSubmit={handleSubmit}
          initialSrc={initialValues?.src ?? ""}
          initialAltText={initialValues?.altText ?? ""}
          confirmLabel={confirmLabel}
        />
      </TabsContent>
      <TabsContent value="file">
        <InsertImageUploadedDialogBody
          onSubmit={handleSubmit}
          initialSrc={initialValues?.src ?? ""}
          initialAltText={initialValues?.altText ?? ""}
          confirmLabel={confirmLabel}
        />
      </TabsContent>
    </Tabs>
  )
}
