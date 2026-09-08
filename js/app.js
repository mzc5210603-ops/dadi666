(function() {
  const state = {
    data: [],
    filterCat: "全部",
    keyword: "",
    current: null
  };

  // ---- 主题切换 ----
  function initTheme() {
    const saved = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", saved);
    document.getElementById("themeToggle").textContent = saved === "dark" ? "☀️" : "🌙";
  }
  document.getElementById("themeToggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    document.getElementById("themeToggle").textContent = next === "dark" ? "☀️" : "🌙";
  });

  // ---- 加载数据 ----
  async function loadData() {
    try {
      const res = await fetch("./data/data.json?_=" + Date.now());
      if (!res.ok) throw new Error("data.json 加载失败: " + res.status);
      state.data = await res.json();
      document.getElementById("lastUpdate").textContent = state.data.lastUpdate || "-";
      render();
    } catch (e) {
      document.getElementById("cardGrid").innerHTML =
        `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">⚠️</div><div class="empty-title">数据加载失败</div><div class="empty-desc">${e.message}</div></div>`;
    }
  }

  // ---- 筛选 ----
  function filter() {
    let list = state.data.items || [];
    if (state.filterCat !== "全部") {
      list = list.filter(it => it["category"] && it["category"].includes(state.filterCat));
    }
    if (state.keyword.trim()) {
      const kw = state.keyword.trim().toLowerCase();
      list = list.filter(it => {
        return Object.values(it).some(v =>
          String(v).toLowerCase().includes(kw)
        );
      });
    }
    return list;
  }

  // ---- 渲染卡片 ----
  function render() {
    const list = filter();
    const grid = document.getElementById("cardGrid");
    document.getElementById("totalCount").textContent = list.length;
    if (!list.length) {
      grid.innerHTML = "";
      document.getElementById("emptyState").style.display = "";
      return;
    }
    document.getElementById("emptyState").style.display = "none";

    grid.innerHTML = list.map((it, idx) => {
      const ratingHtml = it.rating ? `<div class="rating">⭐ ${it.rating}</div>` : "";
      const viewsHtml = it.views ? `<div class="views">👁 ${Number(it.views).toLocaleString()}</div>` : "";
      const tagsArr = it.tags ? it.tags : [];
      const catHtml = it["category"] ? `<span class="card-cat">${it["category"]}</span>` : "";
      const extras = (it.grape ? it.grape.split(/[,，/、]/).slice(0,3) : [])
        .concat(it.origin ? [it.origin.split(" ")[0]] : [])
        .concat(it.skin ? it.skin.split(/[,，/、]/).slice(0,2) : [])
        .concat(it.level ? [it.level] : [])
        .concat(it.alcohol ? [it.alcohol] : [])
        .concat(it.nature ? [it.nature] : [])
        .concat(it.difficulty ? [it.difficulty] : [])
        .concat(it.style ? [it.style] : [])
        .concat(it.age ? [it.age] : [])
        .concat(it.hemisphere ? [it.hemisphere] : []);
      const allTags = [...tagsArr, ...extras].slice(0, 4);
      return `<article class="card" data-idx="${it.title}">
        ${catHtml}
        <h3 class="card-title">${escapeHtml(it.title)}</h3>
        <p class="card-desc">${escapeHtml(it.desc || it.content || it.story || it.facts || it.tasting_notes || it.effect || it.usage || "")}</p>
        ${allTags.length ? `<div class="card-tags">${allTags.map(t=>`<span class="tag">${escapeHtml(String(t).trim())}</span>`).join("")}</div>`:""}
        <div class="card-footer">
          ${ratingHtml || `<span class="tag">查看详情 →</span>`}
          ${viewsHtml}
        </div>
      </article>`;
    }).join("");

    grid.querySelectorAll(".card").forEach(card => {
      card.addEventListener("click", () => {
        const title = card.getAttribute("data-idx");
        const item = list.find(x => x.title === title);
        if (item) showDetail(item);
      });
    });
  }

  // ---- 详情弹窗 ----
  function showDetail(it) {
    const body = document.getElementById("modalBody");
    let kvHtml = `<div class="detail-kv">`;
    const ignoreKeys = new Set(["title","desc","tags","steps","features","obs_guide","practice","brew","content","facts","itinerary","tips","storage","obs_guide","myth","gear","songs","key_points","bad_ex","good_ex","material","materials","story","guide","care","value","specs","origin","season","appearance","meaning","gift","gift_scene","roast","flavor","price","chef","author","dynasty","artist","style","difficulty","time","age","target","best_view","hemisphere","level","views","pros","cons","tasting_notes","food_pairing","grape","alcohol","aging","ingredients","nature","effect","usage","contraindication","dosage","recipe","method","benefit","caution","note","summary","detail","intro","description","steps_detail","usage_method","applicable","side_effect","storage_method","best_time","suitable","unsuitable","match","pairing","feature","highlight","advantage","disadvantage","pro","con","comment","review","rating_detail","source","reference"]);
    Object.keys(it).forEach(k => {
      if (ignoreKeys.has(k)) return;
      const v = it[k];
      if (v === null || v === undefined || v === "") return;
      if (Array.isArray(v)) return;
      const label = k;
      kvHtml += `<div class="kv-item"><span class="kv-key">${label}</span><span class="kv-value">${escapeHtml(String(v))}</span></div>`;
    });
    kvHtml += `</div>`;

    let sections = "";
    const bigFields = [
      ["desc","简介"],
      ["content","内容节选"],
      ["story","故事内容"],
      ["brew","冲煮/冲泡方法"],
      ["steps","详细步骤"],
      ["features","特色亮点"],
      ["practice","练习方案"],
      ["itinerary","行程安排"],
      ["key_points","核心要点"],
      ["bad_ex","❌ 错误示范"],
      ["good_ex","✅ 正确示范"],
      ["songs","曲目进度"],
      ["value","市场参考价"],
      ["specs","规格参数"],
      ["facts","科普知识"],
      ["obs_guide","观测/观察指南"],
      ["tips","贴心小贴士"],
      ["guide","阅读指南"],
      ["storage","存储保存方法"],
      ["myth","神话/历史背景"],
      ["care","养护要点"],
      ["appearance","外观特征"],
      ["meaning","含义"],
      ["gift","送礼场景"],
      ["origin","产地介绍"],
      ["season","最佳时节"],
      ["dynasty","年代"],
      ["artist","作者/书法家"],
      ["style","风格/流派"],
      ["age","适合年龄"],
      ["target","适用人群"],
      ["level","难度等级"],
      ["gear","必备器材"],
      ["difficulty","难度"],
      ["time","制作耗时"],
      ["materials","所需材料"],
      ["material","材料清单"],
      ["best_view","最佳观测时间"],
      ["hemisphere","观测区域"],
      ["price","价格"],
      ["chef","作者"],
      ["author","作者"],
      ["views","浏览量"],
      ["roast","烘焙度"],
      ["flavor","风味描述"],
      ["rating","评分"],
      ["grape","原料/成分"],
      ["alcohol","酒精度数"],
      ["aging","陈酿熟成"],
      ["ingredients","核心成分/配置"],
      ["tasting_notes","品鉴笔记"],
      ["food_pairing","搭配推荐"],
      ["pros","优势亮点"],
      ["cons","不足短板"],
      ["nature","性味归经"],
      ["effect","功效作用"],
      ["usage","用法用量"],
      ["contraindication","禁忌注意事项"],
      ["dosage","用量"],
      ["recipe","配方"],
      ["method","制作方法"],
      ["benefit","功效收益"],
      ["caution","注意事项"],
      ["note","备注说明"],
      ["summary","总结"],
      ["detail","详细说明"],
      ["intro","简介"],
      ["description","描述"],
      ["steps_detail","详细步骤"],
      ["usage_method","使用方法"],
      ["applicable","适用范围"],
      ["side_effect","副作用"],
      ["storage_method","保存方法"],
      ["best_time","最佳时间"],
      ["suitable","适宜人群"],
      ["unsuitable","不适宜人群"],
      ["match","搭配建议"],
      ["pairing","搭配推荐"],
      ["feature","特色"],
      ["highlight","亮点"],
      ["advantage","优点"],
      ["disadvantage","缺点"],
      ["pro","优点"],
      ["con","缺点"],
      ["comment","点评"],
      ["review","评价"],
      ["source","来源"],
      ["reference","参考资料"]
    ];
    bigFields.forEach(([k,label]) => {
      if (it[k] !== undefined && it[k] !== null && String(it[k]).trim() !== "") {
        let v = String(it[k]).trim();
        if (k === "views") v = Number(it[k]).toLocaleString() + " 次";
        if (k === "rating") v = "⭐ " + it[k] + " / 5.0";
        sections += `<div class="detail-section"><div class="section-title">${label}</div><div class="section-content">${escapeHtml(v)}</div></div>`;
      }
    });

    const pros = it.pros ? `<div class="pros"><div class="pros-title">✅ 优点</div>${escapeHtml(it.pros)}</div>` : "";
    const cons = it.cons ? `<div class="cons"><div class="cons-title">❌ 不足</div>${escapeHtml(it.cons)}</div>` : "";
    const prosConsHtml = (pros || cons) ? `<div class="pros-cons">${pros}${cons}</div>` : "";

    const ratingBig = it.rating ? `<div class="detail-rating-bar"><div class="detail-rating-big">${it.rating}<small>/ 5.0</small></div>${it.views?`<span>👁 ${Number(it.views).toLocaleString()} 浏览</span>`:""}</div>` : (it.views?`<div class="detail-rating-bar"><span>👁 ${Number(it.views).toLocaleString()} 浏览</span></div>`:"");

    body.innerHTML = `<div class="detail-header">
      ${ratingBig}
      <h2 class="detail-title">${escapeHtml(it.title)}</h2>
      ${it["category"] ? `<span class="card-cat">${escapeHtml(it["category"])}</span>` : ""}
    </div>
    ${kvHtml}
    ${prosConsHtml}
    ${sections}`;

    document.getElementById("detailModal").style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    document.getElementById("detailModal").style.display = "none";
    document.body.style.overflow = "";
  }
  window.closeModal = closeModal;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  document.querySelectorAll(".cat-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.filterCat = btn.dataset.cat;
      render();
    });
  });

  let searchTimer;
  document.getElementById("searchInput").addEventListener("input", e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.keyword = e.target.value;
      render();
    }, 200);
  });

  function escapeHtml(s) {
    if (s === null || s === undefined) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  initTheme();
  loadData();
})();
