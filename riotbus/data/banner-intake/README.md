# Banner Intake

这个目录用于用自然语言/Markdown 管理首页 banner。

## 文件职责

- `banners.md`：实际生效的 banner 内容库。
- `banner-template.md`：新增 banner 时复制使用的模板。
- `scripts/build-banners.mjs`：读取 `banners.md` 并生成 `data/banners.ts`。

## 图片位置

把 banner 图片放到：

```txt
public/assets/banners/
```

然后在 `banners.md` 里只填写文件名，例如：

```txt
图片文件名：gaga-cancel.png
```

脚本会自动生成：

```ts
imageSrc: "/assets/banners/gaga-cancel.png"
```

## 生成命令

```bash
npm run banners:build
```

生成前会校验必填字段、图片文件是否存在、`id` 是否重复。

