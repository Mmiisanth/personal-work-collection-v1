# RiotBus 艺人头像素材规范

## 存放位置

- Mean 头像：`public/assets/artists/mean/`
- Neutral 头像：`public/assets/artists/neutral/`

## 命名规则

文件名必须和艺人 `id` 完全一致：

- Mean：`{artist-id}-mean.jpg`
- Neutral：`{artist-id}-neutral.jpg`

例如：

- `public/assets/artists/mean/taylor-swift-mean.jpg`
- `public/assets/artists/neutral/taylor-swift-neutral.jpg`

## 当前 20 位艺人文件名

- `taylor-swift-mean.jpg` / `taylor-swift-neutral.jpg`
- `lady-gaga-mean.jpg` / `lady-gaga-neutral.jpg`
- `katy-perry-mean.jpg` / `katy-perry-neutral.jpg`
- `adele-mean.jpg` / `adele-neutral.jpg`
- `rihanna-mean.jpg` / `rihanna-neutral.jpg`
- `lana-del-rey-mean.jpg` / `lana-del-rey-neutral.jpg`
- `lorde-mean.jpg` / `lorde-neutral.jpg`
- `beyonce-mean.jpg` / `beyonce-neutral.jpg`
- `britney-spears-mean.jpg` / `britney-spears-neutral.jpg`
- `ariana-grande-mean.jpg` / `ariana-grande-neutral.jpg`
- `olivia-rodrigo-mean.jpg` / `olivia-rodrigo-neutral.jpg`
- `sabrina-carpenter-mean.jpg` / `sabrina-carpenter-neutral.jpg`
- `billie-eilish-mean.jpg` / `billie-eilish-neutral.jpg`
- `dua-lipa-mean.jpg` / `dua-lipa-neutral.jpg`
- `celine-dion-mean.jpg` / `celine-dion-neutral.jpg`
- `whitney-houston-mean.jpg` / `whitney-houston-neutral.jpg`
- `mariah-carey-mean.jpg` / `mariah-carey-neutral.jpg`
- `charli-xcx-mean.jpg` / `charli-xcx-neutral.jpg`
- `madonna-mean.jpg` / `madonna-neutral.jpg`
- `nicki-minaj-mean.jpg` / `nicki-minaj-neutral.jpg`

## 图片建议

- 推荐尺寸：`512x512` 或更高，正方形。
- 推荐格式：`.jpg`，方便和当前命名规则一致。
- 文件体积：单张最好控制在 `300KB` 以内，避免筛选弹窗卡顿。
- 构图：人脸居中，四周留一点边，圆形裁切时不容易切到脸。

## 版权提醒

不要直接把有版权争议的平台图、摄影师图、未授权官方图提交到公开仓库。更稳的方式是使用你自己有权使用的图，或者只在本地替换测试。

如果某张图不存在，页面会自动回退到彩色文字头像，不会报错。
