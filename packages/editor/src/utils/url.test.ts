import test from "node:test"
import assert from "node:assert/strict"

import { normalizeUrlForOpen, sanitizeUrl, validateUrl } from "./url"

test("normalizeUrlForOpen rejects incomplete web urls", () => {
  assert.equal(normalizeUrlForOpen("https:"), null)
  assert.equal(normalizeUrlForOpen("https://"), null)
  assert.equal(normalizeUrlForOpen("http:"), null)
  assert.equal(normalizeUrlForOpen("http://"), null)
})

test("normalizeUrlForOpen accepts valid absolute and relative urls", () => {
  assert.equal(
    normalizeUrlForOpen("https://example.com/path?q=1"),
    "https://example.com/path?q=1"
  )
  assert.equal(
    normalizeUrlForOpen("/news", "https://example.com"),
    "https://example.com/news"
  )
})

test("normalizeUrlForOpen blocks non-http protocols for window.open", () => {
  assert.equal(normalizeUrlForOpen("mailto:test@example.com"), null)
  assert.equal(normalizeUrlForOpen("javascript:alert(1)"), null)
})

test("validateUrl and sanitizeUrl keep link policies consistent", () => {
  assert.equal(validateUrl("https:"), false)
  assert.equal(validateUrl("https://"), false)
  assert.equal(validateUrl("/relative"), true)
  assert.equal(validateUrl("mailto:test@example.com"), true)
  assert.equal(sanitizeUrl("https://"), "about:blank")
  assert.equal(sanitizeUrl("javascript:alert(1)"), "about:blank")
})
