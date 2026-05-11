import { chunksPath, readJson, writeJson } from "./rag-utils.mjs";

const knowledge = readJson("data/rag/knowledge/artist-knowledge.json");

function compact(value) {
  return String(value ?? "").trim();
}

function listNames(items = []) {
  return items
    .map((item) => `${item.name}${item.explanation ? `：${item.explanation}` : ""}`)
    .filter(Boolean)
    .join("；");
}

function addChunk(chunks, chunk) {
  if (!compact(chunk.text)) return;
  chunks.push({
    ...chunk,
    text: compact(chunk.text).replace(/\s+/g, " "),
  });
}

const chunks = [];

for (const artist of knowledge) {
  const base = {
    artistId: artist.artistId,
    source: "manual",
  };

  addChunk(chunks, {
    ...base,
    id: `${artist.artistId}:profile`,
    category: "profile",
    mode: "all",
    text: [
      `${artist.artistId} 艺人画像`,
      artist.tags?.length ? `标签：${artist.tags.join("、")}` : "",
      artist.profile?.summary ? `简短画像：${artist.profile.summary}` : "",
    ].filter(Boolean).join("\n"),
  });

  addChunk(chunks, {
    ...base,
    id: `${artist.artistId}:names:normal`,
    category: "normal_names",
    mode: "all",
    text: `正常称呼/美称：${listNames(artist.names?.normal)}`,
  });

  addChunk(chunks, {
    ...base,
    id: `${artist.artistId}:names:shade`,
    category: "shade_names",
    mode: "mean",
    aggressive: true,
    text: `黑称/黑话：${listNames(artist.names?.shade)}`,
  });

  addChunk(chunks, {
    ...base,
    id: `${artist.artistId}:fanbase`,
    category: "fanbase",
    mode: "all",
    text: `正常粉丝名：${artist.fanbase?.normalNames?.join(" / ") || artist.fanbase?.name || ""}`,
  });

  addChunk(chunks, {
    ...base,
    id: `${artist.artistId}:fanbase:shade`,
    category: "fanbase_shade",
    mode: "mean",
    aggressive: true,
    text: `粉丝黑称：${listNames(artist.fanbase?.shadeNames)}`,
  });

  addChunk(chunks, {
    ...base,
    id: `${artist.artistId}:wordplay`,
    category: "wordplay",
    mode: "mean",
    aggressive: true,
    text: [
      `黑话造句种子：${artist.wordplaySeeds?.join(" / ") || ""}`,
      `黑话造句例句：${artist.wordplayExamples?.join(" / ") || ""}`,
    ].filter(Boolean).join("\n"),
  });

  for (const [index, rival] of (artist.rivals ?? []).entries()) {
    addChunk(chunks, {
      ...base,
      id: `${artist.artistId}:rival:${index + 1}`,
      category: "rival",
      mode: "mean",
      text: `主要对家：${rival.name || ""}。关系说明：${rival.notes || ""}`,
    });
  }

  for (const [index, item] of (artist.controversies ?? []).entries()) {
    addChunk(chunks, {
      ...base,
      id: `${artist.artistId}:controversy:${index + 1}`,
      category: "controversy",
      mode: "mean",
      verified: item.verified,
      aggressive: item.aggressive,
      text: [
        `事件名：${item.title}`,
        `事件简介：${item.summary}`,
        `粉丝挽尊话术：${item.defenseTalkingPoint}`,
        `黑粉攻击角度：${item.attackAngle}`,
        item.notes ? `备注：${item.notes}` : "",
      ].filter(Boolean).join("\n"),
    });
  }

  for (const [index, item] of (artist.honorPoints ?? []).entries()) {
    addChunk(chunks, {
      ...base,
      id: `${artist.artistId}:honor:${index + 1}`,
      category: "honor",
      mode: "all",
      verified: item.verified,
      text: [
        `荣誉：${item.title}`,
        `粉丝怎么夸：${item.fanPraise}`,
        `黑粉怎么反驳：${item.antiResponse}`,
        item.notes ? `备注：${item.notes}` : "",
      ].filter(Boolean).join("\n"),
    });
  }

  addChunk(chunks, {
    ...base,
    id: `${artist.artistId}:titles`,
    category: "title_material",
    mode: "all",
    text: [
      `Mean 标题梗：${artist.titleMaterials?.mean?.join(" / ") || ""}`,
      `Neutral 标题：${artist.titleMaterials?.neutral?.join(" / ") || ""}`,
      `禁止说法：${artist.titleMaterials?.banned?.join(" / ") || ""}`,
    ].filter(Boolean).join("\n"),
  });
}

writeJson(chunksPath, {
  version: 1,
  generatedAt: new Date().toISOString(),
  chunkCount: chunks.length,
  chunks,
});

console.log(`Built ${chunks.length} RAG chunks -> ${chunksPath}`);
