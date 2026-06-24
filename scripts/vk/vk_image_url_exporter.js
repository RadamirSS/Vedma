/**
 * VK Image URL Exporter — run in Cursor authenticated browser DevTools
 *
 * 1. Open https://vk.com/market-226854094 while logged into VK
 * 2. Paste this script in Console
 * 3. It fetches each product page and collects real image URLs into JSON download
 */
(async function vkExportImageUrls() {
  const PRODUCT_IDS = [
    9737916, 9745558, 9780487, 11728010, 11993088, 11993150, 11993302, 11993344,
    11993371, 11993558, 12000755, 12001991, 12017663, 12017791, 12017825, 12017989,
    12018228, 12018376, 12018398, 12018576, 12018580, 12019030, 12019531, 12019534,
    12019780, 12019786, 12019794, 12019835, 12019851, 12019880, 12050933, 12066326,
    12066335, 12066345, 12066369, 12066379, 12071413, 12071461, 12071497, 12071510,
    12073982, 12224406, 12246321, 12534830, 12534883, 12534893, 12534906, 12534923,
    12534946, 12535118, 12535200, 12550405, 12550425, 12550452, 12550596, 12550624,
    12550933, 12550978, 12551040, 12564164, 12564191, 12564199, 12564596, 12564597,
    12564598, 12564600, 12564603, 12564608, 12690306, 12690325, 12690342, 12690345,
    12690357,
  ];
  const OWNER = 226854094;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function bestUrl(url) {
    return url
      .replace(/&amp;/g, "&")
      .replace(/([?&])cs=\d+x\d+/g, "$1cs=1047x1297")
      .replace(/size=0x180/g, "size=1047x1297");
  }

  function isPlaceholder(url) {
    return /camera_|deactivated_|placeholder|avatar|icon/i.test(url);
  }

  function extractImages(doc) {
    const urls = new Set();
    doc.querySelectorAll('img[src*="userapi"], img[src*="mycdn"], img[src*="impg"]').forEach((img) => {
      const src = img.currentSrc || img.src;
      const w = img.naturalWidth || 0;
      const h = img.naturalHeight || 0;
      if (src && !isPlaceholder(src) && (w === 0 || w >= 120)) urls.add(bestUrl(src));
    });
    return [...urls];
  }

  const results = [];
  for (let i = 0; i < PRODUCT_IDS.length; i++) {
    const id = PRODUCT_IDS[i];
    const cardUrl = `https://vk.com/market-${OWNER}?w=product-${OWNER}_${id}`;
    console.log(`[${i + 1}/${PRODUCT_IDS.length}] ${cardUrl}`);
    try {
      const resp = await fetch(cardUrl, { credentials: "include" });
      const html = await resp.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const title =
        doc.querySelector("h1")?.textContent?.trim() ||
        doc.querySelector("title")?.textContent?.split("-")[0]?.trim() ||
        "";
      const imageUrls = extractImages(doc);
      results.push({ productId: id, cardUrl, title, imageUrls });
    } catch (e) {
      results.push({ productId: id, cardUrl, title: "", imageUrls: [], error: String(e) });
    }
    await sleep(1200);
  }

  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), items: results }, null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "vk_image_urls.json";
  a.click();
  console.log("Done", results.filter((r) => r.imageUrls.length).length, "with images");
  return results;
})();
