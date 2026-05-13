# @thangph2146/lexical-editor

Một thư viện soạn thảo văn bản (Rich Text Editor) dựa trên [Lexical](https://lexical.dev/) dành cho React/Next.js.

## Tính năng chính

- **Rich Text Editing**: Hỗ trợ đầy đủ các định dạng văn bản (Bold, Italic, Underline, Code, v.v.)
- **Plugins Hệ thống**: Tích hợp sẵn nhiều plugin mạnh mẽ (Toolbar, Images, Tables, Layout, v.v.)
- **Dynamic Placeholder**: Hỗ trợ thay đổi placeholder linh hoạt thông qua prop.
- **Modern UI**: Giao diện hiện đại, dễ dàng tùy chỉnh qua CSS Variables.
- **TypeScript Support**: Được viết hoàn toàn bằng TypeScript với định nghĩa kiểu đầy đủ.

## Cài đặt

Sử dụng `npm`:
```bash
npm install @thangph2146/lexical-editor lexical @lexical/react
```

Sử dụng `pnpm`:
```bash
pnpm add @thangph2146/lexical-editor lexical @lexical/react
```

## Cách sử dụng

```tsx
import { LexicalEditor } from "@thangph2146/lexical-editor";
import "@thangph2146/lexical-editor/style.css";

function MyEditor() {
  const handleChange = (editorState) => {
    // Xử lý khi nội dung thay đổi
  };

  return (
    <LexicalEditor
      placeholder="Nhập nội dung tại đây..."
      onChange={handleChange}
    />gioi-thieu:team-section
  );
}
```

## Giấy phép

MIT

## Publish

```bash
pnpm build
npm whoami
npm login
npm publish --access public
```