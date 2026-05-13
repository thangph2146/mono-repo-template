"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { Dispatch, JSX, useCallback, useEffect, useRef, useState } from "react"
import {
  $createLinkNode,
  $isAutoLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from "@lexical/link"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $findMatchingParent, $wrapNodeInElement, mergeRegister } from "@lexical/utils"
import {
  $createTextNode,
  $getSelection,
  $isLineBreakNode,
  $isNodeSelection,
  $isRangeSelection,
  $setSelection,
  BaseSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
} from "lexical"
import { Check, Pencil, Trash, X, Upload, Loader2 } from "lucide-react"
import { createPortal } from "react-dom"

import { getSelectedNode } from "../utils/get-selected-node"
import { setFloatingElemPositionForLinkEditor } from "../utils/set-floating-elem-position-for-link-editor"
import { normalizeUrlForOpen, sanitizeUrl, validateUrl } from "../utils/url"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Flex } from "../ui/flex"
import { TypographyPSmall } from "../ui/typography"
import { $isImageNode } from "../nodes/image-node"
import { $createDownloadLinkNode, $isDownloadLinkNode } from "../nodes/download-link-node"
import { useEditorUploads } from "../context/uploads-context"

function shouldTreatUrlAsDownload(url: string): boolean {
  // Handle absolute file URLs and internal uploads.
  if (typeof url !== "string") return false
  const u = url.toLowerCase()
  if (
    u.includes("/api/uploads/") ||
    u.includes("/uploads/") ||
    u.includes("/api/admin/uploads/") ||
    u.includes("/admin/uploads/")
  )
    return true

  // Common downloadable file extensions.
  return /\.(pdf|doc|docx|xls|xlsx|csv|zip|rar|7z|txt|rtf|png|jpg|jpeg|gif|webp|mp3|wav|mp4|mov|avi)(\?.*)?$/.test(
    u
  )
}

function inferDownloadFileName(url: string): string {
  try {
    const path = url.split("?")[0] ?? ""
    const last = path.split("/").filter(Boolean).pop()
    return last ? decodeURIComponent(last) : "download"
  } catch {
    return "download"
  }
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null
  const row = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`))
  if (!row) return null
  return row.split("=").slice(1).join("=") || null
}

function openExternalUrlSafely(rawUrl: string): boolean {
  if (typeof window === "undefined") {
    return false
  }
  const normalized = normalizeUrlForOpen(rawUrl, window.location.origin)
  if (!normalized) {
    return false
  }
  window.open(normalized, "_blank", "noopener,noreferrer")
  return true
}



function buildHrefFromJsDownloadArg(jsArg: string): string {
  // jsArg is the inner string from javascript:download("...").
  // It might be a relativePath like `files/2026/04/02/foo.pdf`, or an absolute URL.
  const firstSegment = typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean)[0] ?? "" : ""
  const serveBase =
    firstSegment === "admin"
      ? "/api/admin/uploads/serve"
      : "/api/uploads/serve"

  const arg = jsArg.trim()
  if (!arg) return "about:blank"
  if (/^https?:\/\//i.test(arg)) return arg
  if (arg.startsWith("/api/")) return arg

  if (arg.startsWith("images/") || arg.startsWith("files/")) {
    return `${serveBase}/${arg}`
  }

  const m = arg.match(/(images|files)\/.+/i)
  if (m?.[0]) return `${serveBase}/${m[0]}`

  // Can't reliably map "filename-only" to a full relativePath.
  return "about:blank"
}

function FloatingLinkEditor({
  editor,
  isLink,
  setIsLink,
  anchorElem,
  isLinkEditMode,
  setIsLinkEditMode,
}: {
  editor: LexicalEditor
  isLink: boolean
  setIsLink: Dispatch<boolean>
  anchorElem: HTMLElement
  isLinkEditMode: boolean
  setIsLinkEditMode: Dispatch<boolean>
}): JSX.Element {
  const editorRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [editedLinkUrl, setEditedLinkUrl] = useState("")
  const [lastSelection, setLastSelection] = useState<BaseSelection | null>(null)
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { onUploadFile } = useEditorUploads()

  const $updateLinkEditor = useCallback(() => {
    const selection = $getSelection()
    let linkNode = null
    let selectedNode = null

    if ($isRangeSelection(selection)) {
      const node = getSelectedNode(selection)
      if (node !== null) {
        selectedNode = node
        linkNode = $findMatchingParent(node, $isLinkNode)
        if (!linkNode && $isLinkNode(node)) {
          linkNode = node
        }
      }
    } else if ($isNodeSelection(selection)) {
      const nodes = selection.getNodes()
      const node = nodes[0]
      if (node) {
        selectedNode = node
        // Check if the node itself is a link node
        if ($isLinkNode(node)) {
          linkNode = node
        } else {
          // Check if the node is wrapped in a link (e.g., image node in link)
          linkNode = $findMatchingParent(node, $isLinkNode)
          // For image nodes, also check if parent is a link
          if (!linkNode && $isImageNode(node)) {
            const parent = node.getParent()
            if ($isLinkNode(parent)) {
              linkNode = parent
            }
          }
        }
      }
    }

    if (linkNode) {
      setLinkUrl(linkNode.getURL())
    } else {
      setLinkUrl("")
    }

    if (isLinkEditMode && linkNode) {
      setEditedLinkUrl(linkUrl || linkNode.getURL())
    }

    const editorElem = editorRef.current
    const nativeSelection = window.getSelection()
    const activeElement = document.activeElement

    if (editorElem === null) {
      return
    }

    const rootElement = editor.getRootElement()

    // Check if we have a valid selection (with or without link)
    const hasValidSelection = selection !== null
    const hasValidNativeSelection =
      nativeSelection !== null &&
      rootElement !== null &&
      (nativeSelection.anchorNode && rootElement.contains(nativeSelection.anchorNode))

    // Show floating editor if:
    // 1. We have a link node (existing link) - show to view/edit
    // 2. We're in edit mode (creating new link) - show input to create link
    const hasImageNode = $isNodeSelection(selection) && selectedNode && $isImageNode(selectedNode)
    const shouldShowEditor =
      (linkNode !== null || isLinkEditMode) &&
      hasValidSelection &&
      editor.isEditable() &&
      (
        // If in edit mode, always show (even if nativeSelection is not valid)
        isLinkEditMode ||
        hasValidNativeSelection ||
        ($isNodeSelection(selection) && selectedNode) ||
        ($isRangeSelection(selection) && selection.getTextContent().length > 0)
      )
    void hasImageNode // reserved for future: hide editor when selection is image-only

    if (shouldShowEditor) {
      // For node selection (e.g., image), try to get the DOM element
      let domRect: DOMRect | undefined

      if ($isNodeSelection(selection) && selectedNode) {
        // Try to get DOM element using node key
        const nodeKey = selectedNode.getKey()
        const nodeElement = editor.getElementByKey(nodeKey)

        if (nodeElement) {
          // For image nodes wrapped in links, find the link element
          if ($isImageNode(selectedNode) && linkNode) {
            // Find the link element that wraps the image
            const linkElement = nodeElement.closest("a") || nodeElement.parentElement?.closest("a")
            if (linkElement) {
              domRect = linkElement.getBoundingClientRect()
            } else {
              domRect = nodeElement.getBoundingClientRect()
            }
          } else {
            domRect = nodeElement.getBoundingClientRect()
          }
        }
      }

      // Fallback to native selection if we don't have a specific DOM rect
      if (!domRect && nativeSelection) {
        // Try to find link element in DOM if we have a link node
        if (linkNode && nativeSelection.focusNode) {
          // focusNode can be a Text node, so we need to get the parent element
          let focusElement: HTMLElement | null = null
          if (nativeSelection.focusNode instanceof HTMLElement) {
            focusElement = nativeSelection.focusNode
          } else if (nativeSelection.focusNode.parentElement) {
            focusElement = nativeSelection.focusNode.parentElement
          }

          if (focusElement) {
            const linkElement = focusElement.closest("a") || focusElement.parentElement?.closest("a")
            if (linkElement) {
              domRect = linkElement.getBoundingClientRect()
            }
          }
        }
        if (!domRect && nativeSelection.focusNode) {
          // Get parent element if focusNode is not an HTMLElement
          const parentElement = nativeSelection.focusNode instanceof HTMLElement
            ? nativeSelection.focusNode
            : nativeSelection.focusNode.parentElement
          if (parentElement) {
            domRect = parentElement.getBoundingClientRect()
          }
        }
      }

      // If in edit mode but no domRect, try to get from range selection
      if (!domRect && isLinkEditMode && $isRangeSelection(selection)) {
        const range = nativeSelection?.getRangeAt(0)
        if (range) {
          domRect = range.getBoundingClientRect()
        }
      }

      if (domRect) {
        domRect.y += 40
        setFloatingElemPositionForLinkEditor(domRect, editorElem, anchorElem)
      } else if (isLinkEditMode) {
        // If in edit mode but no domRect, show editor at a default position
        // Use a fallback position based on editor root
        if (rootElement) {
          const rootRect = rootElement.getBoundingClientRect()
          const fallbackRect = new DOMRect(
            rootRect.left + 20,
            rootRect.top + 100,
            300,
            50
          )
          setFloatingElemPositionForLinkEditor(fallbackRect, editorElem, anchorElem)
        }
      }
      setLastSelection(selection)
    } else if (!activeElement || !activeElement.classList.contains("editor-link-input")) {
      if (rootElement !== null) {
        setFloatingElemPositionForLinkEditor(null, editorElem, anchorElem)
      }
      setLastSelection(null)
      setIsLinkEditMode(false)
      if (!linkNode) {
        setLinkUrl("")
      }
    }

    return true
  }, [anchorElem, editor, setIsLinkEditMode, isLinkEditMode, linkUrl])

  useEffect(() => {
    const scrollerElem = anchorElem.parentElement

    const update = () => {
      editor.getEditorState().read(() => {
        $updateLinkEditor()
      })
    }

    window.addEventListener("resize", update)

    if (scrollerElem) {
      scrollerElem.addEventListener("scroll", update, { passive: true })
    }

    return () => {
      window.removeEventListener("resize", update)

      if (scrollerElem) {
        scrollerElem.removeEventListener("scroll", update)
      }
    }
  }, [anchorElem.parentElement, editor, $updateLinkEditor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateLinkEditor()
        })
      }),

      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          $updateLinkEditor()
          return true
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isLink) {
            setIsLink(false)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_HIGH
      )
    )
  }, [editor, $updateLinkEditor, setIsLink, isLink])

  useEffect(() => {
    editor.getEditorState().read(() => {
      $updateLinkEditor()
    })
  }, [editor, $updateLinkEditor])

  useEffect(() => {
    if (isLinkEditMode && inputRef.current) {
      inputRef.current.focus()
      // Use setTimeout to avoid calling setState synchronously within effect
      setTimeout(() => {
        setIsLink(true)
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLinkEditMode, isLink])

  const monitorInputInteraction = (
    event: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleLinkSubmission()
    } else if (event.key === "Escape") {
      event.preventDefault()
      setIsLinkEditMode(false)
    }
  }

  const handleLinkSubmission = (submittedUrl?: string, originalFileName?: string) => {
    const rawUrl = typeof submittedUrl === "string" ? submittedUrl : editedLinkUrl
    const url = sanitizeUrl(rawUrl)
    const downloadFileName = originalFileName || (shouldTreatUrlAsDownload(url) ? inferDownloadFileName(url) : null)
    // Block unsafe protocols (e.g. `javascript:`). `sanitizeUrl()` returns `about:blank` for unsupported schemes.
    if (url !== "about:blank" && validateUrl(url)) {
      editor.update(() => {
        // Try to get current selection first
        let selection = $getSelection()

        // If no current selection, try to restore from lastSelection
        if (!selection && lastSelection !== null) {
          // Clone the selection to avoid frozen object error
          if ($isRangeSelection(lastSelection)) {
            const clonedSelection = lastSelection.clone()
            $setSelection(clonedSelection)
            selection = $getSelection()
          } else if ($isNodeSelection(lastSelection)) {
            const clonedSelection = lastSelection.clone()
            $setSelection(clonedSelection)
            selection = $getSelection()
          }
        }

        if (!selection) {
          return
        }

        // Handle node selection (e.g., image nodes)
        if ($isNodeSelection(selection)) {
          const nodes = selection.getNodes()
          if (nodes.length > 0) {
            const node = nodes[0]

            // If it's an image node
            if ($isImageNode(node)) {
              // Check if already wrapped in a link
              const existingLinkNode = $findMatchingParent(node, $isLinkNode) ||
                ($isLinkNode(node.getParent()) ? node.getParent() : null)

              if (existingLinkNode) {
                // Update existing link
                existingLinkNode.setURL(url)
                if (downloadFileName && $isDownloadLinkNode(existingLinkNode)) {
                  existingLinkNode.setDownload(downloadFileName)
                }
              } else {
                // Wrap image in link using wrapNodeInElement (safe for all cases including root)
                const linkNode = downloadFileName
                  ? $createDownloadLinkNode(url, downloadFileName)
                  : $createLinkNode(url)
                $wrapNodeInElement(node, () => linkNode)
              }
            }
          }
        }
        // Handle range selection
        else if ($isRangeSelection(selection)) {
          // Use default TOGGLE_LINK_COMMAND for range selection, then post-process to add `download`.
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url)
          const parent = getSelectedNode(selection).getParent()
          if ($isAutoLinkNode(parent)) {
            const linkNode = downloadFileName
              ? $createDownloadLinkNode(parent.getURL(), downloadFileName, {
                rel: parent.__rel,
                target: parent.__target,
                title: parent.__title,
              })
              : $createLinkNode(parent.getURL(), {
                rel: parent.__rel,
                target: parent.__target,
                title: parent.__title,
              })
            parent.replace(linkNode, true)
          }

          if (downloadFileName) {
            const selectedNode = getSelectedNode(selection)
            // After TOGGLE_LINK_COMMAND, selection's node should be wrapped in a link node.
            const linkNode = $findMatchingParent(selectedNode, $isLinkNode) || ($isLinkNode(selectedNode) ? selectedNode : null)
            if (linkNode) {
              const currentText = linkNode.getTextContent()
              const targetText = originalFileName || downloadFileName
              
              const downloadLinkNode = $createDownloadLinkNode(url, downloadFileName, {
                rel: linkNode.getRel(),
                target: linkNode.getTarget(),
                title: linkNode.getTitle(),
              })
              
              if (currentText === url && targetText) {
                // If the user didn't have any text selected, Lexical's TOGGLE_LINK inserted the raw URL.
                // Replace that text with our targetFileName.
                downloadLinkNode.append($createTextNode(targetText))
              } else {
                // Otherwise keep the children (user's selection)
                const children = linkNode.getChildren()
                if (children.length > 0) {
                  downloadLinkNode.append(...children)
                }
              }

              linkNode.replace(downloadLinkNode)
            }
          }
        }
      })
      setEditedLinkUrl("")
      setIsLinkEditMode(false)
    }
  }

  const handlePickLocalFile = () => {
    if (isUploadingFile) return
    fileInputRef.current?.click()
  }

  const handleUploadLocalFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      setIsUploadingFile(true)
      let uploadedUrl: string | undefined = undefined

      if (onUploadFile) {
        const result = await onUploadFile(file)
        if (result.error) throw new Error(result.error)
        uploadedUrl = result.url
      } else {
        const formData = new FormData()
        formData.append("file", file)

        const firstSegment = typeof window !== "undefined" ? window.location.pathname.split("/").filter(Boolean)[0] ?? "" : ""
        const pathPart = firstSegment === "admin" ? "/admin/uploads" : "/uploads"
        const endpoint = firstSegment === "admin" ? `/admin/api${pathPart}` : `/api${pathPart}`

        const userId = getCookieValue("app_user_id")
        const authToken = getCookieValue("auth-token")
        const headers: Record<string, string> = {}
        if (userId) headers["X-User-Id"] = userId
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`

        const res = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: Object.keys(headers).length > 0 ? headers : undefined,
          body: formData,
        })

        if (!res.ok) {
          throw new Error(`Upload failed: HTTP ${res.status}`)
        }

        const payload = (await res.json()) as {
          success?: boolean
          data?: { url?: string }
          message?: string
          error?: string
        }

        uploadedUrl = payload?.data?.url
        if (!payload?.success || !uploadedUrl) {
          throw new Error(payload?.message || payload?.error || "Upload failed")
        }
      }

      if (uploadedUrl) {
        setEditedLinkUrl(uploadedUrl)
        handleLinkSubmission(uploadedUrl, file.name)
      }
    } catch (error) {
      console.error("[FloatingLinkEditor] Upload local file failed:", error)
    } finally {
      setIsUploadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div
      ref={editorRef}
      className="editor-floating-link-editor"
    >
      {isLinkEditMode || isLink ? (
        isLinkEditMode ? (
          <>
            <div className="editor-floating-link-editor__input-container">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleUploadLocalFile}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.rtf,.txt,.zip,.rar,.7z,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.svg,.mp3,.wav,.mp4,.mov,.avi,.webm"
              />
              <Input
                ref={inputRef}
                value={editedLinkUrl}
                onChange={(event) => setEditedLinkUrl(event.target.value)}
                onKeyDown={monitorInputInteraction}
                className="editor-flex-grow"
              />
              <Button
                size="icon"
                variant="ghost"
                onClick={handlePickLocalFile}
                className="editor-shrink-0"
                disabled={isUploadingFile}
                title={isUploadingFile ? "Uploading..." : "Upload file từ thiết bị"}
              >
                {isUploadingFile ? (
                  <Loader2 className="editor-icon-sm animate-spin" />
                ) : (
                  <Upload className="editor-icon-sm" />
                )}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setIsLinkEditMode(false)
                  setIsLink(false)
                }}
                className="editor-shrink-0"
              >
                <X className="editor-icon-sm" />
              </Button>
              <Button
                size="icon"
                onClick={() => handleLinkSubmission()}
                className="editor-shrink-0"
              >
                <Check className="editor-icon-sm" />
              </Button>
            </div>
          </>
        ) : (
          <div className="editor-floating-link-editor__view-container">
            {/**
             * UX: show sanitized/derived text instead of raw input (prevents showing `javascript:...`).
             * `sanitizeUrl()` may return `about:blank` for unsupported protocols.
             */}

            {(() => {
              let href = sanitizeUrl(linkUrl)
              const jsDownloadMatch =
                typeof linkUrl === "string"
                  ? linkUrl.match(/^javascript:download\(\s*(['"])(.*?)\1\s*\)\s*$/i)
                  : null

              let downloadAttr: string | undefined
              if (jsDownloadMatch) {
                const jsArg = jsDownloadMatch[2] ?? ""
                href = buildHrefFromJsDownloadArg(jsArg)
                if (href !== "about:blank") {
                  downloadAttr = inferDownloadFileName(href)
                }
              } else if (shouldTreatUrlAsDownload(href)) {
                downloadAttr = inferDownloadFileName(href)
              }

              const isDownload = typeof downloadAttr === "string" && downloadAttr.length > 0
              const isSafeHref = href !== "about:blank" && validateUrl(href)
              const text =
                jsDownloadMatch
                  ? "Download"
                  : shouldTreatUrlAsDownload(href)
                    ? inferDownloadFileName(href)
                    : href === "about:blank"
                      ? "Invalid URL"
                      : linkUrl

              return (
                <a
                  href={isDownload ? href : "#"}
                  download={downloadAttr}
                  // `download` hoạt động tốt hơn nếu không mở tab mới
                  target={isDownload ? "_self" : undefined}
                  rel={isDownload ? undefined : undefined}
                  className="editor-floating-link-editor__link"
                  onClick={(event) => {
                    if (isDownload) return
                    event.preventDefault()
                    if (isSafeHref) {
                      openExternalUrlSafely(href)
                    }
                  }}
                >
                  <TypographyPSmall className="editor-truncate">{text}</TypographyPSmall>
                </a>
              )
            })()}
            <Flex gap={0} className="editor-shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditedLinkUrl(linkUrl)
                  setIsLinkEditMode(true)
                }}
              >
                <Pencil className="editor-icon-sm" />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                onClick={() => {
                  editor.update(() => {
                    const selection = $getSelection()
                    // Handle node selection (e.g., image nodes)
                    if ($isNodeSelection(selection)) {
                      const nodes = selection.getNodes()
                      if (nodes.length > 0) {
                        const node = nodes[0]
                        if ($isImageNode(node)) {
                          const linkNode = $findMatchingParent(node, $isLinkNode) ||
                            ($isLinkNode(node.getParent()) ? node.getParent() : null)
                          if (linkNode) {
                            // Remove link by unwrapping - insert children into parent and remove link
                            const parent = linkNode.getParent()
                            if (parent) {
                              const children = linkNode.getChildren()
                              children.forEach((child) => {
                                linkNode.insertBefore(child)
                              })
                              linkNode.remove()
                            }
                          }
                        }
                      }
                    } else {
                      // Use default TOGGLE_LINK_COMMAND for range selection
                      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
                    }
                  })
                }}
              >
                <Trash className="editor-icon-sm" />
              </Button>
            </Flex>
          </div>
        )
      ) : null}
    </div>
  )
}

function useFloatingLinkEditorToolbar(
  editor: LexicalEditor,
  anchorElem: HTMLDivElement | null,
  isLinkEditMode: boolean,
  setIsLinkEditMode: Dispatch<boolean>
): JSX.Element | null {
  const [activeEditor, setActiveEditor] = useState(editor)
  const [isLink, setIsLink] = useState(false)

  useEffect(() => {
    function $updateToolbar() {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        const focusNode = getSelectedNode(selection)
        const focusLinkNode = $findMatchingParent(focusNode, $isLinkNode)
        const focusAutoLinkNode = $findMatchingParent(
          focusNode,
          $isAutoLinkNode
        )
        if (!(focusLinkNode || focusAutoLinkNode)) {
          setIsLink(false)
          return
        }
        const badNode = selection
          .getNodes()
          .filter((node) => !$isLineBreakNode(node))
          .find((node) => {
            const linkNode = $findMatchingParent(node, $isLinkNode)
            const autoLinkNode = $findMatchingParent(node, $isAutoLinkNode)
            return (
              (focusLinkNode && !focusLinkNode.is(linkNode)) ||
              (linkNode && !linkNode.is(focusLinkNode)) ||
              (focusAutoLinkNode && !focusAutoLinkNode.is(autoLinkNode)) ||
              (autoLinkNode &&
                (!autoLinkNode.is(focusAutoLinkNode) ||
                  autoLinkNode.getIsUnlinked()))
            )
          })
        if (!badNode) {
          setIsLink(true)
        } else {
          setIsLink(false)
        }
      } else if ($isNodeSelection(selection)) {
        const nodes = selection.getNodes()
        if (nodes.length === 0) {
          setIsLink(false)
          return
        }
        const node = nodes[0]
        if (node) {
          // Check if node itself is a link
          if ($isLinkNode(node)) {
            setIsLink(true)
            return
          }
          // Check if node is wrapped in a link (using $findMatchingParent for better traversal)
          const linkParent = $findMatchingParent(node, $isLinkNode)
          if (linkParent) {
            setIsLink(true)
            return
          }
          // For image nodes, also check direct parent
          if ($isImageNode(node)) {
            const parent = node.getParent()
            if ($isLinkNode(parent)) {
              setIsLink(true)
              return
            }
          }
        }
        setIsLink(false)
      }
    }
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar()
        })
      }),
      // Register TOGGLE_LINK_COMMAND handler for node selection (image nodes)
      editor.registerCommand(
        TOGGLE_LINK_COMMAND,
        (url: string | null) => {
          const selection = $getSelection()

          // Handle node selection (e.g., image nodes)
          if ($isNodeSelection(selection)) {
            const nodes = selection.getNodes()
            if (nodes.length > 0) {
              const node = nodes[0]

              if ($isImageNode(node)) {
                if (url) {
                  // Create or update link
                  const existingLinkNode = $findMatchingParent(node, $isLinkNode) ||
                    ($isLinkNode(node.getParent()) ? node.getParent() : null)

                  if (existingLinkNode) {
                    // Update existing link
                    existingLinkNode.setURL(url)
                  } else {
                    // Wrap image in link using wrapNodeInElement (safe for all cases including root)
                    const linkNode = $createLinkNode(url)
                    $wrapNodeInElement(node, () => linkNode)
                  }
                } else {
                  // Remove link
                  const linkNode = $findMatchingParent(node, $isLinkNode) ||
                    ($isLinkNode(node.getParent()) ? node.getParent() : null)
                  if (linkNode) {
                    // Remove link by unwrapping - insert children into parent and remove link
                    const parent = linkNode.getParent()
                    if (parent) {
                      const children = linkNode.getChildren()
                      children.forEach((child) => {
                        linkNode.insertBefore(child)
                      })
                      linkNode.remove()
                    }
                  }
                }
                return true
              }
            }
          }

          // Let default handler process range selection
          return false
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, newEditor) => {
          editor.getEditorState().read(() => {
            $updateToolbar()
          })
          setActiveEditor(newEditor)
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      // Register a listener for when node selection changes to image with link
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          editor.getEditorState().read(() => {
            const selection = $getSelection()
            if ($isNodeSelection(selection)) {
              const nodes = selection.getNodes()
              if (nodes.length > 0) {
                const node = nodes[0]
                if ($isImageNode(node)) {
                  const linkNode = $findMatchingParent(node, $isLinkNode) ||
                    ($isLinkNode(node.getParent()) ? node.getParent() : null)
                  if (linkNode) {
                    // Delay to ensure DOM is updated
                    setTimeout(() => {
                      editor.getEditorState().read(() => {
                        $updateToolbar()
                      })
                    }, 10)
                  }
                }
              }
            }
          })
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        (payload) => {
          let shouldReturnTrue = false

          editor.getEditorState().read(() => {
            const selection = $getSelection()

            // Check if we clicked on an image node (with or without link)
            let hasImageNode = false
            if ($isNodeSelection(selection)) {
              const nodes = selection.getNodes()
              if (nodes.length > 0) {
                const node = nodes[0]
                if ($isImageNode(node)) {
                  hasImageNode = true
                }
              }
            }

            // Handle Ctrl/Cmd + click to open link
            if (payload.metaKey || payload.ctrlKey) {
              if ($isRangeSelection(selection)) {
                const node = getSelectedNode(selection)
                if (node) {
                  const linkNode = $findMatchingParent(node, $isLinkNode)
                  if ($isLinkNode(linkNode)) {
                    const url = linkNode.getURL()
                    // Validate URL before opening to prevent errors with invalid URLs
                    if (url && validateUrl(url)) {
                      openExternalUrlSafely(url)
                    }
                    shouldReturnTrue = true
                    return
                  }
                }
              } else if ($isNodeSelection(selection)) {
                const nodes = selection.getNodes()
                if (nodes.length > 0) {
                  const node = nodes[0]
                  let linkNode = null
                  if ($isLinkNode(node)) {
                    linkNode = node
                  } else {
                    if (node) {
                      linkNode = $findMatchingParent(node, $isLinkNode)
                      if (!linkNode && $isImageNode(node)) {
                        const parent = node.getParent()
                        if ($isLinkNode(parent)) {
                          linkNode = parent
                        }
                      }
                    }
                  }
                  if (linkNode) {
                    const url = linkNode.getURL()
                    if (url && validateUrl(url)) {
                      openExternalUrlSafely(url)
                    }
                    shouldReturnTrue = true
                    return
                  }
                }
              }
            }

            // If we clicked on an image (with or without link), trigger toolbar update
            if (hasImageNode) {
              // Use requestAnimationFrame to ensure selection is updated
              requestAnimationFrame(() => {
                editor.getEditorState().read(() => {
                  $updateToolbar()
                })
              })
            }
          })

          if (shouldReturnTrue) {
            return true
          }

          // Trigger toolbar update on click to ensure floating editor shows
          setTimeout(() => {
            editor.getEditorState().read(() => {
              $updateToolbar()
            })
          }, 0)
          return false
        },
        COMMAND_PRIORITY_HIGH
      )
    )
  }, [editor])

  if (!anchorElem) {
    return null
  }

  return createPortal(
    <FloatingLinkEditor
      editor={activeEditor}
      isLink={isLink}
      anchorElem={anchorElem}
      setIsLink={setIsLink}
      isLinkEditMode={isLinkEditMode}
      setIsLinkEditMode={setIsLinkEditMode}
    />,
    anchorElem
  )
}

export function FloatingLinkEditorPlugin({
  anchorElem,
  isLinkEditMode,
  setIsLinkEditMode,
}: {
  anchorElem: HTMLDivElement | null
  isLinkEditMode: boolean
  setIsLinkEditMode: Dispatch<boolean>
}): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  return useFloatingLinkEditorToolbar(
    editor,
    anchorElem,
    isLinkEditMode,
    setIsLinkEditMode
  )
}
