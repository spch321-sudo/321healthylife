# 321healthylife

## 2026-11-03 v7-up1103（自動更新確認版）
- 加入通用自動更新掛件 `upd321.js`（version.json 輪詢＋reg.update、空閒自動套用，朗讀／輸入／共讀／美圖工作室中只顯示頂端更新條、防無限重整），設定頁新增「版本與更新」（檢查更新／強制更新）。
- `sw.js` 改為網路優先（HTML／JS／JSON），並只清自己前綴（`nsmain321-`）的快取；舊快取 `newstart321-v6-gx1103` 一併清理。原本各 repo 共用 `newstart321`/`321health` 前綴會互刪快取，已分開。
- 版本 `v7-up1103` 四處一致：`version.json`、`sw.js`、index.html／sc.html／en.html（APPVER）、本 README。

## 2026-11-03 gx1103
- 新增朗讀（頂列 🔊，逐句高亮、背景播放、Azure TTS 三聲音，失敗改用內建語音）、畫線、小智、美圖工作室、321 工具箱（gxr.js / gxa.js，繁／簡／EN 三頁皆有）。
- sw.js 快取版本 newstart321-v6-gx1103，預先快取 gxr.js、gxa.js。
