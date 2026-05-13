"use client"

import React, { createContext, useContext, ReactNode } from "react"

export interface ImageItem {
  fileName: string
  originalName: string
  size: number
  mimeType: string
  url: string
  relativePath: string
  createdAt: number
}

export interface FolderNode {
  name: string
  path: string
  images: ImageItem[]
  subfolders: FolderNode[]
}

export interface EditorUploadsContextType {
  isLoading: boolean
  folderTree?: FolderNode
  onUploadFile?: (file: File) => Promise<{ url: string; error?: string }>
}

const EditorUploadsContext = createContext<EditorUploadsContextType | undefined>(undefined)

export function EditorUploadsProvider({
  children,
  value,
}: {
  children: ReactNode
  value: EditorUploadsContextType
}) {
  return (
    <EditorUploadsContext.Provider value={value}>
      {children}
    </EditorUploadsContext.Provider>
  )
}

export function useEditorUploads() {
  const context = useContext(EditorUploadsContext)
  if (context === undefined) {
    // Default values if provider is not used
    return {
      isLoading: false,
      folderTree: undefined,
    }
  }
  return context
}
