import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(root, "public/assets/artists/source");
const meanDir = path.join(root, "public/assets/artists/mean");
const neutralDir = path.join(root, "public/assets/artists/neutral");

const artists = [
  "taylor-swift",
  "lady-gaga",
  "katy-perry",
  "adele",
  "rihanna",
  "lana-del-rey",
  "lorde",
  "beyonce",
  "britney-spears",
  "ariana-grande",
  "olivia-rodrigo",
  "sabrina-carpenter",
  "billie-eilish",
  "dua-lipa",
  "celine-dion",
  "whitney-houston",
  "mariah-carey",
  "charli-xcx",
  "madonna",
  "nicki-minaj",
];

const sourceFileMap = {};

function clamp(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function rgb(color) {
  return `rgb(${color.map(clamp).join(",")})`;
}

function mix(a, b, t) {
  return a.map((value, index) => value * (1 - t) + b[index] * t);
}

function shift(color, amount) {
  return color.map((value) => clamp(value + amount));
}

async function paletteFromSource(id) {
  const source = path.join(sourceDir, sourceFileMap[id] ?? `${id}-source.png`);
  const stats = await sharp(source)
    .resize(64, 64, { fit: "cover" })
    .removeAlpha()
    .stats();
  return stats.channels.slice(0, 3).map((channel) => channel.mean);
}

function artistProfile(id, base) {
  const defaults = {
    accent: [124, 230, 168],
    backgroundA: mix(base, [210, 255, 240], 0.5),
    backgroundB: mix(base, [128, 214, 170], 0.46),
    hair: mix(base, [80, 60, 48], 0.45),
    hairShadow: mix(base, [42, 32, 30], 0.5),
    lip: mix(base, [170, 42, 78], 0.5),
    outfit: mix(base, [58, 70, 92], 0.42),
    skin: mix(base, [226, 176, 138], 0.55),
    symbol: "spark",
    hairShape: "long",
    faceShape: "oval",
    glasses: false,
  };

  const overrides = {
    "taylor-swift": {
      accent: [210, 42, 72],
      backgroundA: mix(base, [255, 216, 108], 0.55),
      backgroundB: mix(base, [255, 92, 170], 0.42),
      hair: [232, 198, 96],
      hairShadow: [172, 132, 58],
      lip: [184, 26, 54],
      outfit: [28, 28, 34],
      skin: [236, 188, 150],
      symbol: "star",
      hairShape: "bangs",
      faceShape: "heart",
    },
    "lady-gaga": {
      accent: [124, 230, 168],
      backgroundA: mix(base, [210, 255, 240], 0.5),
      backgroundB: mix(base, [128, 214, 170], 0.46),
      hair: [232, 232, 220],
      hairShadow: [166, 170, 162],
      lip: [28, 100, 86],
      outfit: [62, 146, 108],
      skin: [222, 178, 140],
      symbol: "bolt",
      hairShape: "sculptural",
      faceShape: "angular",
      glasses: true,
    },
    "katy-perry": { hair: [28, 30, 42], hairShadow: [12, 14, 22], lip: [212, 42, 86], accent: [255, 120, 190], symbol: "circle", hairShape: "waves", faceShape: "round" },
    adele: { hair: [210, 154, 78], hairShadow: [140, 92, 44], lip: [174, 50, 62], accent: [238, 204, 80], outfit: [26, 24, 24], symbol: "diamond", hairShape: "volume", faceShape: "round" },
    rihanna: { hair: [42, 30, 28], hairShadow: [18, 14, 12], lip: [160, 42, 64], accent: [92, 210, 255], outfit: [32, 44, 58], skin: [150, 92, 64], symbol: "circle", hairShape: "short", faceShape: "diamond" },
    "lana-del-rey": { hair: [122, 78, 48], hairShadow: [72, 44, 30], lip: [142, 56, 72], accent: [170, 170, 170], symbol: "diamond", hairShape: "waves", faceShape: "long" },
    lorde: { hair: [42, 32, 28], hairShadow: [18, 14, 12], lip: [92, 36, 54], accent: [154, 120, 255], outfit: [26, 28, 34], symbol: "moon", hairShape: "curls", faceShape: "long" },
    beyonce: { hair: [222, 176, 82], hairShadow: [150, 104, 44], lip: [156, 54, 72], accent: [255, 186, 70], skin: [154, 96, 62], symbol: "sun", hairShape: "volume", faceShape: "diamond" },
    "britney-spears": { hair: [230, 196, 108], hairShadow: [160, 118, 58], lip: [192, 64, 92], accent: [255, 158, 216], symbol: "star", hairShape: "long", faceShape: "heart" },
    "ariana-grande": { hair: [72, 46, 36], hairShadow: [34, 22, 18], lip: [184, 86, 116], accent: [245, 198, 255], symbol: "moon", hairShape: "ponytail", faceShape: "small" },
    "olivia-rodrigo": { hair: [70, 42, 34], hairShadow: [32, 20, 16], lip: [156, 50, 76], accent: [188, 156, 255], symbol: "diamond", hairShape: "long", faceShape: "heart" },
    "sabrina-carpenter": { hair: [236, 196, 102], hairShadow: [176, 128, 56], lip: [194, 72, 98], accent: [255, 225, 168], symbol: "spark", hairShape: "bangs", faceShape: "small" },
    "billie-eilish": { hair: [38, 40, 34], hairShadow: [12, 14, 12], lip: [74, 52, 60], accent: [160, 255, 114], outfit: [20, 26, 20], symbol: "circle", hairShape: "long", faceShape: "soft" },
    "dua-lipa": { hair: [34, 28, 28], hairShadow: [14, 12, 12], lip: [172, 50, 74], accent: [141, 232, 255], symbol: "spark", hairShape: "bob", faceShape: "angular" },
    "celine-dion": { hair: [176, 134, 78], hairShadow: [104, 74, 42], lip: [150, 58, 72], accent: [232, 232, 232], symbol: "diamond", hairShape: "long", faceShape: "long" },
    "whitney-houston": { hair: [36, 26, 24], hairShadow: [12, 10, 10], lip: [150, 50, 72], accent: [214, 245, 255], skin: [138, 86, 58], symbol: "circle", hairShape: "volume", faceShape: "oval" },
    "mariah-carey": { hair: [224, 178, 86], hairShadow: [144, 96, 44], lip: [178, 62, 86], accent: [255, 240, 163], symbol: "spark", hairShape: "curls", faceShape: "soft" },
    "charli-xcx": { hair: [30, 26, 24], hairShadow: [10, 8, 8], lip: [96, 42, 56], accent: [127, 255, 0], outfit: [16, 16, 16], symbol: "square", hairShape: "messy", faceShape: "angular" },
    madonna: { hair: [230, 206, 130], hairShadow: [166, 126, 62], lip: [196, 40, 70], accent: [255, 179, 199], symbol: "star", hairShape: "waves", faceShape: "angular" },
    "nicki-minaj": { hair: [235, 86, 160], hairShadow: [160, 40, 112], lip: [228, 60, 130], accent: [255, 122, 200], skin: [150, 92, 68], symbol: "diamond", hairShape: "long", faceShape: "round" },
  };

  return { ...defaults, ...(overrides[id] ?? {}) };
}

function poly(points, fill, extra = "") {
  return `<polygon points="${points}" fill="${fill}" ${extra}/>`;
}

function faceGeometry(shape) {
  const shapes = {
    oval: {
      outer: "170,132 342,132 384,230 346,344 256,394 166,344 128,230",
      left: "170,132 256,112 256,394 166,344 128,230",
      right: "256,112 342,132 384,230 346,344 256,394",
      brow: "202,180 256,132 312,182 258,226",
      cheekLeft: "196,250 256,226 258,342 190,322",
      cheekRight: "258,226 326,250 322,322 258,342",
      nose: "250,238 272,292 244,294",
      mouth: "212,318 300,318 278,342 236,342",
      eyeLeft: "186,232 232,220 224,240 188,244",
      eyeRight: "280,220 330,232 326,244 290,240",
      linerLeft: "178,218 234,204 230,212 182,226",
      linerRight: "278,204 336,218 332,226 282,212",
    },
    heart: {
      outer: "154,136 358,136 394,226 340,354 256,398 172,354 118,226",
      left: "154,136 256,110 256,398 172,354 118,226",
      right: "256,110 358,136 394,226 340,354 256,398",
      brow: "196,176 256,128 318,176 258,224",
      cheekLeft: "184,252 256,226 258,342 182,320",
      cheekRight: "258,226 336,252 330,320 258,342",
      nose: "250,238 272,292 242,294",
      mouth: "210,316 302,318 278,344 236,342",
      eyeLeft: "182,228 232,216 224,238 186,244",
      eyeRight: "280,216 334,228 326,244 290,238",
      linerLeft: "174,214 236,202 230,212 180,226",
      linerRight: "276,202 340,214 332,226 282,212",
    },
    round: {
      outer: "160,142 352,142 402,238 354,350 256,390 158,350 110,238",
      left: "160,142 256,122 256,390 158,350 110,238",
      right: "256,122 352,142 402,238 354,350 256,390",
      brow: "196,188 256,140 318,188 258,232",
      cheekLeft: "178,258 256,232 260,342 168,324",
      cheekRight: "260,232 340,258 344,324 260,342",
      nose: "250,242 274,294 242,296",
      mouth: "208,318 304,318 282,344 232,344",
      eyeLeft: "184,232 234,220 226,242 186,246",
      eyeRight: "278,220 330,232 328,246 288,242",
      linerLeft: "178,218 238,204 232,214 182,228",
      linerRight: "274,204 336,218 332,228 280,214",
    },
    long: {
      outer: "174,120 338,120 374,224 342,364 256,408 170,364 138,224",
      left: "174,120 256,104 256,408 170,364 138,224",
      right: "256,104 338,120 374,224 342,364 256,408",
      brow: "204,176 256,124 310,176 258,230",
      cheekLeft: "198,256 256,230 258,356 190,332",
      cheekRight: "258,230 324,256 322,332 258,356",
      nose: "250,240 272,300 244,302",
      mouth: "216,326 296,326 276,350 238,350",
      eyeLeft: "188,228 232,216 224,236 190,242",
      eyeRight: "282,216 326,228 322,242 290,236",
      linerLeft: "182,214 234,202 230,212 186,224",
      linerRight: "278,202 332,214 328,224 282,212",
    },
    angular: {
      outer: "162,130 350,126 392,220 352,350 256,404 160,350 120,220",
      left: "162,130 256,108 256,404 160,350 120,220",
      right: "256,108 350,126 392,220 352,350 256,404",
      brow: "196,176 256,126 318,176 258,222",
      cheekLeft: "188,246 256,222 260,346 178,322",
      cheekRight: "260,222 334,246 334,322 260,346",
      nose: "250,236 276,296 242,298",
      mouth: "210,320 302,316 280,342 234,344",
      eyeLeft: "180,228 234,212 224,236 184,244",
      eyeRight: "278,212 338,228 330,244 288,236",
      linerLeft: "170,212 238,198 232,210 176,226",
      linerRight: "274,198 346,212 336,226 280,210",
    },
    diamond: {
      outer: "172,126 340,126 402,238 338,360 256,402 174,360 110,238",
      left: "172,126 256,106 256,402 174,360 110,238",
      right: "256,106 340,126 402,238 338,360 256,402",
      brow: "196,178 256,128 318,178 258,228",
      cheekLeft: "178,250 256,228 258,350 174,326",
      cheekRight: "258,228 340,250 338,326 258,350",
      nose: "250,238 274,296 242,298",
      mouth: "212,320 300,320 278,344 236,344",
      eyeLeft: "182,230 232,216 224,238 184,244",
      eyeRight: "280,216 332,230 328,244 288,238",
      linerLeft: "176,216 236,202 230,212 180,226",
      linerRight: "276,202 338,216 332,226 282,212",
    },
    small: {
      outer: "184,138 328,138 366,226 332,346 256,386 180,346 146,226",
      left: "184,138 256,118 256,386 180,346 146,226",
      right: "256,118 328,138 366,226 332,346 256,386",
      brow: "208,184 256,140 306,184 258,224",
      cheekLeft: "204,252 256,224 258,336 194,318",
      cheekRight: "258,224 318,252 318,318 258,336",
      nose: "252,240 270,288 246,290",
      mouth: "220,314 292,314 274,338 240,338",
      eyeLeft: "194,230 234,218 226,238 196,242",
      eyeRight: "280,218 320,230 318,242 290,238",
      linerLeft: "188,216 236,204 232,214 192,226",
      linerRight: "276,204 326,216 322,226 280,214",
    },
    soft: {
      outer: "164,136 348,136 388,232 348,350 256,392 164,350 124,232",
      left: "164,136 256,116 256,392 164,350 124,232",
      right: "256,116 348,136 388,232 348,350 256,392",
      brow: "198,184 256,136 316,184 258,228",
      cheekLeft: "188,256 256,228 258,342 184,322",
      cheekRight: "258,228 330,256 328,322 258,342",
      nose: "250,240 272,292 244,294",
      mouth: "214,318 298,318 278,342 236,342",
      eyeLeft: "186,230 232,218 224,240 188,244",
      eyeRight: "282,218 328,230 326,244 290,240",
      linerLeft: "180,216 234,204 230,214 184,226",
      linerRight: "278,204 334,216 330,226 282,214",
    },
  };

  return shapes[shape] ?? shapes.oval;
}

function hairSvg(profile, hair, hairShadow) {
  const light = rgb(shift(hair, 24));
  const mid = rgb(hair);
  const dark = rgb(hairShadow);
  const deep = rgb(shift(hairShadow, -16));
  const gloss = rgb(shift(hair, 38));

  const shapes = {
    bangs: `
      ${poly("145,103 205,45 284,38 360,68 398,132 365,170 270,122 180,166", mid)}
      ${poly("145,132 188,108 168,350 102,372 92,234", dark)}
      ${poly("342,124 398,156 426,324 362,356 338,214", deep)}
      ${poly("178,78 246,46 236,174 166,196", light)}
      ${poly("228,48 292,48 282,180 238,178", mid)}
      ${poly("286,58 344,84 318,174 282,178", dark)}
      ${poly("202,122 238,112 224,170 192,184", gloss)}
    `,
    sculptural: `
      ${poly("118,114 196,44 310,42 398,112 382,178 256,118 138,178", mid)}
      ${poly("138,170 198,94 176,338 108,356 88,220", dark)}
      ${poly("330,98 406,166 430,330 352,354 330,214", rgb(shift(hairShadow, 10)))}
      ${poly("194,60 258,24 338,70 286,130 218,126", light)}
      ${poly("150,134 216,88 190,206 124,226", rgb(shift(hair, 14)))}
      ${poly("292,42 386,80 348,126 278,92", gloss)}
    `,
    ponytail: `
      ${poly("132,128 204,62 314,66 382,128 360,168 256,118 150,176", mid)}
      ${poly("342,130 438,104 468,160 390,204", dark)}
      ${poly("140,174 184,122 166,326 106,338 92,230", dark)}
      ${poly("206,70 300,70 326,126 244,112", light)}
      ${poly("354,120 456,132 424,178 366,168", deep)}
    `,
    short: `
      ${poly("132,112 206,62 318,66 386,128 360,194 256,130 148,190", mid)}
      ${poly("142,168 190,122 176,292 120,304 102,224", dark)}
      ${poly("320,122 384,174 398,292 344,310 326,214", deep)}
      ${poly("208,76 306,76 326,126 246,116", light)}
    `,
    bob: `
      ${poly("124,118 196,56 314,58 394,128 382,236 322,308 256,130 188,308 126,236", mid)}
      ${poly("126,176 184,118 174,324 116,330 88,230", dark)}
      ${poly("326,118 390,176 420,330 350,336 330,214", deep)}
      ${poly("204,72 306,72 330,128 244,114", light)}
    `,
    waves: `
      ${poly("118,132 184,56 306,46 398,124 384,182 322,148 258,116 186,162 126,206", mid)}
      ${poly("126,178 194,116 176,360 102,374 86,230", dark)}
      ${poly("326,112 404,164 430,350 356,368 332,218", deep)}
      ${poly("182,74 250,50 234,142 172,170", light)}
      ${poly("248,52 318,66 344,130 260,112", gloss)}
      ${poly("150,248 198,214 176,300 128,324", rgb(shift(hair, 10)))}
      ${poly("336,240 390,218 404,306 356,326", rgb(shift(hairShadow, 4)))}
    `,
    volume: `
      ${poly("90,134 168,46 284,26 408,86 438,178 390,226 256,118 126,228", mid)}
      ${poly("116,170 196,82 172,374 84,386 68,238", dark)}
      ${poly("326,80 428,156 454,360 358,382 332,216", deep)}
      ${poly("178,54 278,28 332,88 238,116", light)}
      ${poly("116,118 182,68 168,172 98,196", gloss)}
      ${poly("338,96 410,142 378,214 326,170", rgb(shift(hair, 12)))}
    `,
    curls: `
      ${poly("102,136 168,58 286,40 404,112 418,190 338,160 258,122 166,176", mid)}
      <circle cx="142" cy="168" r="50" fill="${dark}"/>
      <circle cx="176" cy="108" r="46" fill="${mid}"/>
      <circle cx="248" cy="74" r="44" fill="${light}"/>
      <circle cx="324" cy="98" r="48" fill="${mid}"/>
      <circle cx="374" cy="170" r="52" fill="${deep}"/>
      ${poly("112,202 174,162 170,360 92,372 72,248", dark)}
      ${poly("330,164 410,206 430,352 354,370 330,230", deep)}
    `,
    messy: `
      ${poly("108,130 178,54 292,44 400,114 372,184 310,142 252,122 178,172 122,218", mid)}
      ${poly("126,172 188,104 170,356 98,370 82,232", dark)}
      ${poly("328,106 402,166 430,336 354,360 332,216", deep)}
      ${poly("168,70 216,42 204,124 144,150", light)}
      ${poly("218,48 282,44 246,132 210,118", mid)}
      ${poly("286,52 354,84 314,152 270,120", deep)}
      ${poly("154,132 208,110 182,204 120,226", rgb(shift(hair, 14)))}
    `,
    long: `
      ${poly("124,128 184,58 300,46 388,124 374,178 256,120 140,178", mid)}
      ${poly("132,168 184,108 170,356 102,372 88,228", dark)}
      ${poly("330,108 398,166 424,344 356,362 332,216", rgb(shift(hairShadow, 6)))}
      ${poly("190,70 292,52 326,120 238,116", light)}
    `,
  };

  return shapes[profile.hairShape] ?? shapes.long;
}

function lowPolySvg(id, profile) {
  const {
    accent,
    backgroundA,
    backgroundB,
    hair,
    hairShadow,
    lip,
    outfit,
    skin,
    symbol,
  } = profile;
  const skinLight = shift(skin, 26);
  const skinDark = shift(skin, -34);
  const outfitDark = shift(outfit, -42);
  const outfitLight = shift(outfit, 28);

  const faceParts = faceGeometry(profile.faceShape);
  const hairShape = hairSvg(profile, hair, hairShadow);

  const face =
    `
      ${poly(faceParts.outer, rgb(skin))}
      ${poly(faceParts.left, rgb(skinLight))}
      ${poly(faceParts.right, rgb(skinDark))}
      ${poly(faceParts.brow, rgb(shift(skinLight, 10)))}
      ${poly(faceParts.cheekLeft, rgb(shift(skin, 18)))}
      ${poly(faceParts.cheekRight, rgb(shift(skinDark, -8)))}
    `;

  const eyes =
    profile.glasses
      ? `
        ${poly("178,216 240,206 234,246 180,248", "rgb(8,8,8)")}
        ${poly("276,206 338,216 336,248 282,246", "rgb(8,8,8)")}
        <rect x="236" y="224" width="44" height="10" fill="rgb(8,8,8)"/>
      `
      : `
        ${poly(faceParts.eyeLeft, "rgb(8,8,8)")}
        ${poly(faceParts.eyeRight, "rgb(8,8,8)")}
        ${poly(faceParts.linerLeft, rgb(lip))}
        ${poly(faceParts.linerRight, rgb(lip))}
      `;

  const icon = {
    bolt: poly("388,62 438,62 406,126 448,126 358,220 382,148 338,148", rgb(accent)),
    circle: `<circle cx="396" cy="120" r="38" fill="${rgb(accent)}"/>`,
    diamond: poly("396,72 438,120 396,168 354,120", rgb(accent)),
    moon: `<path d="M416 78a48 48 0 1 0 0 84a37 37 0 1 1 0-84Z" fill="${rgb(accent)}"/>`,
    spark: poly("392,64 406,106 450,112 416,138 426,182 392,156 356,184 368,138 326,112 376,106", rgb(accent)),
    square: `<rect x="360" y="82" width="72" height="72" rx="12" fill="${rgb(accent)}" transform="rotate(10 396 118)"/>`,
    star: poly("382,62 398,108 446,112 410,138 422,184 382,156 344,184 356,138 320,112 366,108", "rgb(10,10,10)"),
    sun: `<circle cx="396" cy="120" r="34" fill="${rgb(accent)}"/><circle cx="396" cy="120" r="52" fill="none" stroke="${rgb(accent)}" stroke-width="8" stroke-dasharray="8 14"/>`,
  }[symbol] ?? poly("382,62 398,108 446,112 410,138 422,184 382,156 344,184 356,138 320,112 366,108", rgb(accent));

  return `
    <svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${rgb(backgroundA)}"/>
          <stop offset="100%" stop-color="${rgb(backgroundB)}"/>
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="18" stdDeviation="14" flood-color="rgba(0,0,0,.18)"/>
        </filter>
      </defs>
      <rect width="512" height="512" rx="42" fill="url(#bg)"/>
      ${poly("-40,80 148,-30 558,334 558,468", `rgba(${accent.map(clamp).join(",")},.22)`)}
      ${poly("-20,430 168,308 556,520 -20,520", "rgba(255,255,255,.18)")}
      <g filter="url(#softShadow)">
        ${poly("112,434 400,434 468,512 44,512", rgb(outfit))}
        ${poly("92,512 172,388 256,456 340,388 420,512", rgb(outfit))}
        ${poly("156,420 256,462 356,420 388,512 124,512", rgb(outfitLight))}
        ${poly("174,388 104,358 46,512 126,512", rgb(outfitDark))}
        ${poly("338,388 408,358 466,512 386,512", rgb(outfitDark))}
        ${poly("214,318 298,318 324,426 188,426", rgb(skinDark))}
        ${face}
        ${hairShape}
        ${eyes}
        ${poly(faceParts.nose, rgb(shift(skinDark, -28)))}
        ${poly(faceParts.mouth, rgb(lip))}
        ${icon}
        ${symbol === "star" ? poly("82,104 146,86 164,164 96,182", "rgb(255,248,220)") : '<circle cx="112" cy="126" r="28" fill="rgb(8,8,8)"/>'}
      </g>
    </svg>
  `;
}

async function styleAvatar(id) {
  const source = path.join(sourceDir, sourceFileMap[id] ?? `${id}-source.png`);
  try {
    await fs.access(source);
  } catch {
    console.warn(`Skipped ${id}: missing source image ${source}`);
    return false;
  }
  const base = await paletteFromSource(id);
  const profile = artistProfile(id, base);
  const svg = Buffer.from(lowPolySvg(id, profile));
  const output = await sharp(svg)
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer();

  await fs.writeFile(path.join(neutralDir, `${id}-neutral.jpg`), output);
  await fs.writeFile(path.join(meanDir, `${id}-mean.jpg`), output);
  return true;
}

await fs.mkdir(meanDir, { recursive: true });
await fs.mkdir(neutralDir, { recursive: true });

let styledCount = 0;
for (const id of artists) {
  if (await styleAvatar(id)) {
    styledCount += 1;
  }
}

console.log(`Styled ${styledCount}/${artists.length} source-informed low-poly avatars into mean + neutral folders.`);
