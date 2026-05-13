import { JSX, useCallback, useMemo, useState } from "react"
import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"

export function useEditorModal(): [
  JSX.Element | null,
  (
    title: string,
    showModal: (onClose: () => void) => JSX.Element,
    closeOnClickOutside?: boolean,
    dialogContentClassName?: string
  ) => void,
] {
  const [modalContent, setModalContent] = useState<null | {
    closeOnClickOutside: boolean
    content: JSX.Element
    dialogContentClassName?: string
    title: string
  }>(null)

  const onClose = useCallback(() => {
    setModalContent(null)
  }, [])

  const modal = useMemo(() => {
    if (modalContent === null) {
      return null
    }
    const { title, content, closeOnClickOutside, dialogContentClassName } = modalContent
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className={dialogContentClassName} disableOutsideClick={!closeOnClickOutside}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{title}</DialogDescription>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    )
  }, [modalContent, onClose])

  const showModal = useCallback(
    (
      title: string,
      getContent: (onClose: () => void) => JSX.Element,
      closeOnClickOutside = false,
      dialogContentClassName?: string
    ) => {
      setModalContent({
        closeOnClickOutside,
        content: getContent(onClose),
        dialogContentClassName,
        title,
      })
    },
    [onClose]
  )

  return [modal, showModal]
}
