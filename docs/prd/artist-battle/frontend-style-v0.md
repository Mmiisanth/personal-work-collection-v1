# RiotBus Frontend Style v0

## 1. Core Direction

`RiotBus / 乱斗巴士` 的视觉目标不是普通 AI 工具站，也不是传统音乐资料库。

它应该像：
- `Charli XCX - brat` 的荧光绿色态度
- iOS 动态玻璃组件
- 欧美娱乐小报的挑事标题
- 一个可以开撕但又看起来很贵的艺人 PK 舞台

一句话：

**brat 绿的乱斗小报，装在一套苹果式流体玻璃 UI 里。**

## 2. Visual Keywords

- brat green
- neon
- liquid glass
- frosted glass
- noise texture
- glossy capsule
- slanted cards
- bento grid
- sticky sections
- fluid layout
- bold black typography
- soft but sharp
- mean but polished

## 3. Color System

主色必须围绕 brat 式荧光绿展开，但整站不能只剩一种绿。

- `brat-green`: `#8CFF4F`
- `brat-green-hot`: `#7CFF2F`
- `brat-green-soft`: `#B8FF9C`
- `brat-green-bg`: `#E6FFDC`
- `soft-pink`: `#FF7AC8`
- `soft-pink-light`: `#FFD2EA`
- `acid-yellow`: `#EAFF3D`
- `ink`: `#050505`
- `muted-ink`: `#3F443A`
- `glass-white`: `rgba(255, 255, 245, 0.62)`
- `glass-green`: `rgba(185, 255, 150, 0.42)`
- `glass-gray`: `rgba(230, 230, 230, 0.56)`
- `line`: `rgba(0, 0, 0, 0.22)`

使用规则：
- 主背景以浅荧光绿为底，但要叠 noise texture 降低廉价感。
- `Mean / 刻薄女孩` 使用荧光绿，气质更冲。
- `Neutral / 清清白白` 使用淡荧光粉红，气质更轻、更软。
- 荧光黄只做强调，不铺大面积。
- 黑色用于标题、关键按钮、强文字对比。
- 大段正文不要直接压在纯透明玻璃上，必须有磨砂底。

## 4. Texture And Depth

页面需要有质感，不要一整块平绿。

- 背景加入非常轻的 noise texture。
- noise 透明度控制在 `0.04 - 0.08`。
- 背景可以有轻微明暗层次，但不要做传统渐变大海报。
- 玻璃卡片使用 `backdrop-blur`，不要只靠透明度。
- 大卡片要有 subtle border，让边界轻轻浮出来。
- 阴影要软，避免变成厚重塑料按钮。

建议 CSS 方向：

```css
backdrop-filter: blur(20px) saturate(1.25);
background: rgba(255, 255, 245, 0.62);
border: 1px solid rgba(255, 255, 255, 0.55);
box-shadow: 0 18px 48px rgba(0, 0, 0, 0.12);
```

## 5. Typography

RiotBus 的字不能太普通。

标题字体方向：
- 粗黑
- 低字腔压力
- 视觉上要有冲突感
- 不要太圆，不要太可爱

建议字体：
- `Archivo Black`
- `Anton`
- `Arial Black` 作为 fallback
- 如果后续有授权，可以找 Druk / Compact Grotesk 这类更狠的方向

正文方向：
- 清楚
- 干净
- 不和标题抢戏
- 用来承载数据、AI 报告、弹窗内容

规则：
- `RiotBus`、大标题、模式名、CTA 使用粗黑。
- 数据表、长段 AI 内容不要全粗黑。
- 不要给所有文字都套 brat 风格，否则会很吵。
- 不使用负字距。

## 6. Layout System

整体布局要有 fluid layout 的感觉。

- 桌面端使用居中大画布，最大宽度控制在 `1280px - 1440px`。
- 主页面以纵向 section 串联，不做传统后台侧边栏。
- 首屏保留一点下一 section 的露出，让用户知道还能往下看。
- 内容区使用 responsive grid，移动端自然折叠。
- 模块之间留白要大一点，避免变成表单后台。
- 结果页可以更密，但仍要保留呼吸感。

响应式规则：
- 桌面端：Banner 舞台横向展开，左右斜角卡片可见。
- 平板端：保留主 Banner，侧卡减少宽度。
- 移动端：侧卡可以变成上下叠层或只露边缘，不强行保留完整三卡舞台。
- 弹窗移动端改成近全屏 bottom sheet 或 full sheet。
- 结果页移动端改成数据在上、AI 在下。

## 7. Bento Grid

首页下半部分可以用 bento grid 承载信息，但不要做成满屏卡片堆砌。

适合放进 bento 的内容：
- 模式介绍
- 默认 PK 组合
- 数据维度说明
- 今日热瓜
- 生成报告入口

bento 规则：
- 卡片圆角比玻璃弹窗小一点。
- 每张卡只承载一个重点。
- 大卡负责视觉，小卡负责行动。
- 不做卡套卡。
- 不让文字贴边，内边距至少 `20px`。

## 8. Sticky Sections

可以使用 sticky section 强化产品节奏。

建议位置：
- 首页品牌和模式选择区可以在滚动中短暂 sticky。
- 结果页顶部的当前 PK 信息可以 sticky。
- AI 追问输入框可以固定在右侧面板底部。

规则：
- sticky 只用于提升操作效率，不要到处粘。
- sticky 元素需要有玻璃底，否则滚动时会和内容打架。
- 移动端 sticky 需要谨慎，避免遮挡正文。

## 9. Component Language

### 9.1 Liquid Glass Cards

用于：
- Banner
- 弹窗
- 筛选器
- AI 面板
- PDF 预览

要求：
- 玻璃感明显
- 文字可读
- 有 subtle border
- 背景 blur 足够
- 卡片内层文字区域可以加更实的磨砂底

### 9.2 Slanted Banner Cards

Banner 卡片保留当前 Figma 方向。

- 中间主卡最大，正面展示。
- 左右卡片倾斜，像舞台侧翼。
- 左右卡片可以用平行四边形或 3D transform 做透视。
- 左右卡片只放短标题或图，不塞长文。
- 主卡负责承载 headline、图片和点击行为。

### 9.3 Capsule Switch

用于：
- Banner 切换条
- mode 切换
- 小型 filter 控件

规则：
- 外层是半透明胶囊玻璃。
- 内层滑块是实体荧光色。
- `Mean` 选中用 brat green。
- `Neutral` 选中用 soft pink。
- hover 时外层 glass 提亮。

### 9.4 Buttons

主按钮：
- 胶囊形
- 粗黑文字
- 荧光绿 / 荧光黄背景
- hover 时轻微上浮或发亮

次级按钮：
- 毛玻璃底
- subtle border
- 黑色文字

关闭按钮：
- 圆形
- 简单 `x`
- 背景可以是半透明浅灰
- hover 时略微放大

### 9.5 Inputs

输入框不要像传统后台表单。

- 使用胶囊或软矩形。
- 玻璃底 + 清晰边框。
- focus 时使用荧光绿或粉色 outline。
- API key 输入区域要更稳一点，不要过度透明。

## 10. Motion System

动效要像“玻璃界面在移动”，不要像 PPT。

### 10.1 Banner Carousel

目标：
- 中间 Banner 替换左右两边卡片。
- 卡片像在舞台上换位，而不是简单切图。

规则：
- 使用 spring animation。
- 中间卡移动到左 / 右侧时，尺寸缩小并倾斜。
- 侧卡进入中间时，恢复正面、放大、提高 opacity。
- 动画时间 `420ms - 560ms`。
- easing 保持软，但不要弹得太玩具。

### 10.2 Capsule Slider

用于 mode 和 Banner indicator。

规则：
- 点击时滑块先轻微变宽。
- 移动过程中保持胶囊形。
- 到位后回缩。
- 动画时间 `220ms - 320ms`。
- 使用 spring，低弹性。

### 10.3 Hover States

hover 是必须的，尤其桌面端。

- Banner hover：轻微上浮、玻璃高光增强。
- CTA hover：轻微 scale `1.02`。
- 圆形关闭按钮 hover：scale `1.06`。
- 艺人头像 hover：出现 ring 或 glow。
- 维度 checkbox hover：边框变亮。

### 10.4 Micro Interactions

建议加入：
- 艺人头像选中时出现小 check，带 pop 动效。
- 维度勾选时方框轻微 bounce。
- API check 成功时出现短暂绿色反馈。
- API check 失败时出现小 toast。
- PDF 生成时按钮进入 loading 状态。

### 10.5 Scroll Reveal

用于首页内容节奏。

- Banner 区首屏直接出现，不要延迟太久。
- 模式介绍、bento grid、推荐 PK 可轻微 scroll reveal。
- reveal 使用 `opacity + translateY(12px)`。
- 延迟不要过长，控制在 `60ms - 120ms` stagger。

### 10.6 Modal Motion

弹窗打开：
- 背景轻微 blur / dim。
- 弹窗 `opacity 0 -> 1`。
- 弹窗 `translateY(10px) -> 0`。

弹窗关闭：
- 淡出即可。

时间：
- `180ms - 260ms`

## 11. Page-Specific Direction

### 11.1 Home

首页要像一个娱乐小报舞台。

- 首屏突出 RiotBus。
- 中间是 3 卡 Banner 舞台。
- 下方是 mode 区。
- mode 区可以和 bento grid 接上。
- 底色是 brat green bg + noise。

首页不要：
- 纯白。
- 大段解释。
- 传统 dashboard 布局。
- 过度商业官网感。

### 11.2 News Modal

资讯弹窗要轻。

- 左图右文。
- 左下保留 source link。
- 右侧文字有磨砂底。
- 字数少，重点狠。
- 不放强制 PK CTA。

### 11.3 Filter Modal

筛选弹窗是“上车前最后一步”。

- 当前 mode 放左上角。
- 艺人头像横向排列。
- 已选 `0/2`、`1/2`、`2/2` 要明显。
- 维度选择用大 checkbox。
- API 区更像可折叠设置。
- 确认按钮要有发车感。

### 11.4 Result Page

结果页要更清楚。

- 左边数据表更硬一点。
- 右边 AI 面板更软一点。
- 顶部显示当前 mode 和两位艺人。
- AI 输入框固定在面板底部。
- 数据缺失要明确显示，不要让 AI 圆过去。

### 11.5 PDF Modal

PDF 弹窗像“生成一张可发出去的战报”。

- 左侧是生成内容。
- 右侧是背景选择。
- 背景色块要明显。
- 生成按钮使用深绿或荧光黄。
- 预览区要保证文字可读。

## 12. Accessibility And Readability

这套视觉很亮，所以可读性要守住。

- 大段正文不要放在透明度太高的玻璃上。
- 文字和背景对比度要够。
- 玻璃组件下方如果有复杂内容，必须加磨砂层。
- hover 信息不能成为唯一信息来源，移动端需要点按提示。
- 所有按钮都要有 focus 状态。
- 动效需要尊重 `prefers-reduced-motion`。

## 13. Implementation Notes

建议前端技术实现：
- Tailwind CSS 定义 tokens。
- Framer Motion 做 Banner 换位、滑块和弹窗动效。
- CSS `backdrop-filter` 做玻璃。
- 轻量 noise 可以用 CSS background image 或小纹理图。
- 用 CSS variables 管理 mode 色彩。
- 使用 responsive grid 和 container width 管理页面。

组件拆分建议：
- `GlassPanel`
- `SlantedBannerCard`
- `CapsuleSwitch`
- `ModeSelector`
- `ArtistPicker`
- `MetricSelector`
- `AiPanel`
- `DataTable`
- `ExportPreview`

## 14. Design Guardrails

要坚持：
- brat green 是主角。
- iOS glass 是组件语言。
- 粗黑标题只用在需要喊出来的地方。
- 卡片有边界，但不要厚重。
- 交互有手感，但不花哨。

要避免：
- 绿色铺满到像儿童产品。
- 所有组件都圆成泡泡。
- 所有文字都粗黑。
- 玻璃透明到不可读。
- 动效过度弹跳。
- 结果页像聊天软件，丢掉左侧数据可信感。
