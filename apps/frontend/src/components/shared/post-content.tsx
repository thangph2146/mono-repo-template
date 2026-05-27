"use client"

import { LexicalEditor } from "@thangph2146/lexical-editor"

export function PostContent({ content }: { content?: unknown | null }) {
  return <LexicalEditor value={content} readOnly className="max-w-6xl mx-auto" />
}
