import { chromium, request } from "playwright"

const baseURL = process.env.SMOKE_BASE_URL || "https://www.xiaodudu.top"
const username = process.env.SMOKE_ADMIN_USERNAME
const password = process.env.SMOKE_ADMIN_PASSWORD

const publicRoutes = [
  "/",
  "/blogs",
  "/diary",
  "/projects",
  "/gallery",
  "/guestbook",
  "/entertainment",
  "/timeline",
  "/contact",
  "/xhub",
]

const adminRoutes = [
  "/dashboard",
  "/dashboard/blogs",
  "/dashboard/diary",
  "/dashboard/projects",
  "/dashboard/timelines",
  "/dashboard/resume",
  "/dashboard/gallery",
  "/dashboard/guestbook",
]

const adminModalChecks = [
  { route: "/dashboard/blogs", trigger: "写文章", name: "博客编辑器" },
  { route: "/dashboard/diary", trigger: "写日记", name: "日记编辑器" },
  { route: "/dashboard/projects", trigger: "新建项目", name: "项目编辑器" },
  { route: "/dashboard/timelines", trigger: "新建记录", name: "时间线编辑器" },
  { route: "/dashboard/gallery", trigger: "添加照片", name: "照片编辑器" },
  { route: "/dashboard/gallery", tab: "相册", trigger: "新建相册", name: "相册编辑器" },
  { route: "/dashboard/gallery", tab: "访客", trigger: "添加访客", name: "访客编辑器" },
]

const retiredAdminRoutes = [
  "/dashboard/coding-journey",
  "/dashboard/deploy-projects",
  "/dashboard/portfolio-stats",
  "/dashboard/visitor-ip-logs",
  "/dashboard/work-experiences",
  "/dashboard/skills",
  "/dashboard/certificates",
  "/dashboard/tech-tools",
]

const failures = []
const results = []
const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ locale: "zh-CN", viewport: { width: 1440, height: 900 } })
const page = await context.newPage()

page.on("pageerror", (error) => failures.push(`页面异常: ${error.message}`))
page.on("console", (message) => {
  if (message.type() === "error") failures.push(`控制台异常: ${message.text()}`)
})
page.on("requestfailed", (requestInfo) => {
  const url = requestInfo.url()
  const reason = requestInfo.failure()?.errorText || "unknown"
  if (reason.includes("ERR_ABORTED")) return
  if (!url.includes("spotify.com") && !url.includes("steampowered.com") && !url.includes("steamstatic.com")) {
    failures.push(`请求失败: ${url} (${reason})`)
  }
})
page.on("response", (response) => {
  if (response.status() >= 500) failures.push(`HTTP ${response.status()}: ${response.url()}`)
})

async function visit(route, scope) {
  const before = failures.length
  const response = await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {})
  await page.waitForTimeout(route === "/entertainment" ? 14_000 : 1_500)
  const text = await page.locator("body").innerText()
  if (!response || response.status() >= 400) failures.push(`${scope} ${route} 返回 ${response?.status() || "无响应"}`)
  if (text.length < 30) failures.push(`${scope} ${route} 页面内容为空`)
  if (text.includes("Application failed to render")) failures.push(`${scope} ${route} 渲染失败`)
  if (text.includes("Agung Kurniawan")) failures.push(`${scope} ${route} 仍包含旧站个人信息`)
  if (scope === "公开页" && /Hai!|Buku Tamu|Jangan tampilkan|kunjungan kamu/.test(text)) {
    failures.push(`${scope} ${route} 仍包含留言提示的印尼语文案`)
  }
  if (scope === "公开页") {
    const translationControls = await page.locator("button:visible").evaluateAll((buttons) =>
      buttons.filter((button) => {
        const label = [button.textContent, button.getAttribute("title"), button.getAttribute("aria-label")]
          .filter(Boolean)
          .join(" ")
        return /\b(translate|translation|translating)\b/i.test(label)
      }).length
    )
    if (translationControls > 0) failures.push(`${scope} ${route} 仍展示翻译控件`)
  }
  if (route === "/") {
    if (text.includes("项目记录")) failures.push("首页仍展示项目记录区块")
    if (text.includes("文章还在整理中")) failures.push("首页仍展示博客区块")
    if (text.includes("经验年限") || text.includes("公开贡献")) failures.push("首页仍展示成绩统计")
    if (text.includes("谢谢你来访")) failures.push("首页仍展示已删除的致谢文案")
    if (!text.includes("Visual/LiDAR SLAM") || !text.includes("Robot Navigation")) {
      failures.push("首页没有完整合并个人信息")
    }
    if (!text.includes("欢迎踏入我的小世界") || !text.includes("fortune favor the brave")) {
      failures.push("首页欢迎文案或座右铭未更新")
    }
    if (text.includes("也可以叫我 profighted")) failures.push("首页仍展示 profighted 别名说明")
    if (text.includes("慢慢积累，把学习变成可以被看见的作品")) failures.push("首页仍展示已删除的 tagline")
    const contactText = await page.locator("#contacts").innerText().catch(() => "")
    const emailHref = await page.locator('#contacts a[href^="mailto:"]').getAttribute("href").catch(() => "")
    if (!contactText.includes("欢迎交流") || !contactText.includes("GitHub") || !contactText.includes("邮箱")) {
      failures.push("首页底部联系按钮不完整")
    }
    if (contactText.includes("联系我") || contactText.includes("小嘟嘟") || contactText.includes("智能科学与技术研究生")) {
      failures.push("首页底部仍展示已删除的联系介绍")
    }
    if (emailHref !== "mailto:1412822254@qq.com") failures.push("首页邮箱按钮链接不正确")
    const faviconHref = await page.locator('link[rel="icon"]').getAttribute("href").catch(() => "")
    if (faviconHref !== "/profile/avatar.png?v=20260717") failures.push("浏览器页签未使用新版个人头像")
    const heroBio = page.locator('[aria-label*="欢迎踏入我的小世界"]')
    const darkColor = await heroBio.evaluate((element) => {
      document.documentElement.classList.add("dark")
      return getComputedStyle(element).color
    }).catch(() => "")
    if (!darkColor || darkColor === "rgba(0, 0, 0, 0)" || darkColor === "transparent") {
      failures.push("首页欢迎文案在深色模式下不可见")
    }
  }
  if (route === "/projects") {
    const removedProjectText = text.match(/查看部署页|公开项目|私有项目|合作项目/)
    if (removedProjectText) failures.push(`项目页仍包含旧模块：${removedProjectText[0]}`)
    if (!text.includes("研究类项目") || !text.includes("开发类项目")) failures.push("项目页缺少研究/开发分类")
    if (!text.includes("研究记录和开发实践汇总") || text.includes("从 GitHub 与本站后台汇总")) {
      failures.push("项目页副标题未更新")
    }
  }
  if (route === "/guestbook") {
    if (await page.locator("h1").count() !== 1) failures.push("留言簿主标题重复")
    if (await page.getByRole("button", { name: /^写留言$/ }).count() !== 1) failures.push("留言簿顶部写留言入口重复")
    if (text.includes("部署测试") || text.includes("最新留言")) failures.push("留言簿仍展示测试留言或最新留言卡片")
  }
  if (route === "/blogs") {
    if (text.includes("小嘟嘟的博客")) failures.push("博客页仍展示黄色说明提示")
    const englishCategory = text.match(/\b(Technology|Tutorial|Tips & Tricks|Programming|Design|General|News|Career)\b/)
    if (englishCategory) failures.push(`博客页仍展示英文分类：${englishCategory[0]}`)
  }
  if (route === "/entertainment") {
    if (text.includes("点击统计卡片可以进入对应分类")) failures.push("娱乐页仍展示统计卡片说明")
  }
  if (route === "/timeline") {
    const legacyTimelineText = text.match(/Selesai|Sekarang|Sedang Berlangsung|\bTranslate\b|机器人感知|路径规划/)
    if (legacyTimelineText) failures.push(`时间线仍包含旧文案：${legacyTimelineText[0]}`)
    for (const expected of ["数字媒体技术", "智能科学与工程学院", "Visual/LiDAR SLAM", "Robot Navigation", "Robot"]) {
      if (!text.includes(expected)) failures.push(`时间线缺少新内容：${expected}`)
    }
  }
  if (scope === "后台页") {
    const untranslated = text.match(/Tidak ada|Belum ada|Simpan Perubahan|Ya, Hapus|Tambah Tamu|Total Photos|Personal Photos|Guest Uploads|New Timeline Entry|New Project|Edit Project|Gallery Manager|Guestbook Moderation|Menampilkan|Pengunjung|Rata-rata Rating|Menunggu Approval|Personal \(Saya\)|Approved \(Publik\)|Pending \(Tersembunyi\)|Informasi Timeline|Album & Dimensi|Memuat halaman|Reset filter|\bpublished\b|\bdraft\b/)
    if (untranslated) failures.push(`${scope} ${route} 仍包含未翻译文案：${untranslated[0]}`)
  }
  results.push({ scope, route, ok: failures.length === before })
}

async function checkAdminModal({ route, tab, trigger, name }) {
  const before = failures.length
  await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  await page.waitForLoadState("networkidle", { timeout: 5_000 }).catch(() => {})
  if (tab) {
    const tabButton = page.getByRole("button", { name: new RegExp(`^${tab}`) }).first()
    if (await tabButton.isVisible().catch(() => false)) {
      await tabButton.click()
      await page.waitForTimeout(300)
    } else {
      failures.push(`${name}的“${tab}”标签不可用`)
    }
  }
  const button = page.getByRole("button", { name: new RegExp(trigger) }).first()
  if (!(await button.isVisible().catch(() => false))) {
    failures.push(`${name}入口“${trigger}”不可用`)
  } else {
    await button.click()
    await page.waitForTimeout(500)
    const text = await page.locator("body").innerText()
    const untranslated = text.match(/Tidak ada|Belum ada|Simpan|Batal|Hapus|Tambah|Kelola|Pilih|Judul|Deskripsi|Kategori|Tanggal|Nama Pengunjung|Gambar Avatar|Menyimpan|Apakah Anda|Tindakan ini|Peringatan Kritis|New |Edit |Save |Cancel|Delete|Create |Upload |Total Photos|Personal Photos|Guest Uploads|Approved|Pending|Unknown|\bpublished\b|\bdraft\b|\bblue\b|\borange\b|\bgreen\b|\byellow\b|\bpurple\b|\bred\b|\bcyan\b/)
    if (untranslated) failures.push(`${name}仍包含未翻译文案：${untranslated[0]}`)
  }
  results.push({ scope: "后台弹窗", route: name, ok: failures.length === before })
}

async function checkRetiredAdminRoute(route) {
  const before = failures.length
  await page.goto(`${baseURL}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  await page.waitForURL((url) => url.pathname === "/dashboard", { timeout: 5_000 }).catch(() => {
    failures.push(`已移除的后台页面 ${route} 未重定向到后台首页`)
  })
  results.push({ scope: "后台重定向", route, ok: failures.length === before })
}

async function checkEntertainmentApis() {
  const before = failures.length
  const api = await request.newContext({ baseURL })
  try {
    const steam = await api.get("/api/steam-games")
    const steamPayload = await steam.json().catch(() => null)
    const steamGames = steamPayload?.response?.games
    const steamSource = steam.headers()["x-steam-source"]
    if (!steam.ok() || !Array.isArray(steamGames) || steamGames.length === 0) {
      failures.push("Steam 接口没有返回真实游戏库")
    }
    if (!['live', 'cache'].includes(steamSource)) failures.push(`Steam 数据来源异常：${steamSource || "未知"}`)

    const music = await api.get("/api/music-data")
    const musicPayload = await music.json().catch(() => null)
    const artists = musicPayload?.artists
    const requiredArtists = ["卢广仲", "周杰伦", "林俊杰", "王力宏", "郭静", "梁静茹", "陈奕迅"]
    if (!music.ok() || !Array.isArray(artists) || !requiredArtists.every((name) => artists.some((artist) => artist.name === name && artist.spotify_artist_id))) {
      failures.push("音乐接口没有返回完整的常听歌手列表")
    }
  } finally {
    await api.dispose()
  }
  results.push({ scope: "娱乐接口", route: "Steam 与音乐", ok: failures.length === before })
}

async function checkContentApis() {
  const before = failures.length
  const api = await request.newContext({ baseURL })
  try {
    const projects = await api.get("/api/github-repos")
    const projectPayload = await projects.json().catch(() => null)
    if (!projects.ok() || !Array.isArray(projectPayload) || projectPayload.length === 0) {
      failures.push("GitHub 项目接口没有返回公开仓库")
    } else if (projectPayload.some((repo) => !String(repo.full_name || "").startsWith("promotesd/"))) {
      failures.push("GitHub 项目接口返回了非 promotesd 仓库")
    }

    for (const feedPath of ["/rss.xml", "/diary-rss.xml"]) {
      const feed = await api.get(feedPath)
      const body = await feed.text()
      if (!feed.ok() || !feed.headers()["content-type"]?.includes("application/rss+xml") || !body.includes("<rss")) {
        failures.push(`${feedPath} 不是有效的 RSS 输出`)
      }
    }

    const timelines = await api.get("/api/timelines")
    const timelinePayload = await timelines.json().catch(() => null)
    const timelineItems = timelinePayload?.data
    if (!timelines.ok() || !Array.isArray(timelineItems) || timelineItems.length !== 2) {
      failures.push("时间线接口没有返回两条教育经历")
    } else {
      const serialized = JSON.stringify(timelineItems)
      for (const expected of ["福州大学", "哈尔滨工程大学", "本科", "研究生", "智能科学与工程学院", "Visual/LiDAR SLAM", "Robot Navigation", "Robot"]) {
        if (!serialized.includes(expected)) failures.push(`时间线缺少正确内容：${expected}`)
      }
      for (const removed of ["Selesai", "Sekarang", "Sedang Berlangsung", "机器人感知", "路径规划", "IMU"]) {
        if (serialized.includes(removed)) failures.push(`时间线接口仍包含旧内容：${removed}`)
      }
      if (/Ã|Â|â€|æœ|ç¦|å°|ï¼/.test(serialized)) failures.push("时间线接口仍包含乱码")
    }
  } finally {
    await api.dispose()
  }
  results.push({ scope: "内容接口", route: "GitHub 与 RSS", ok: failures.length === before })
}

async function checkEntertainmentUi() {
  const before = failures.length
  await page.goto(`${baseURL}/entertainment`, { waitUntil: "domcontentloaded", timeout: 30_000 })
  await page.getByRole("button", { name: /^游戏$/ }).click()
  await page.locator('img[src*="steam/apps"]').first().waitFor({ state: "attached", timeout: 20_000 }).catch(() => {})
  const steamCovers = await page.locator('img[src*="steam/apps"]').count()
  if (steamCovers === 0) failures.push("娱乐页没有渲染真实 Steam 游戏封面")

  await page.getByRole("button", { name: /^音乐$/ }).click()
  await page.waitForTimeout(6_000)
  const musicText = await page.locator("body").innerText()
  for (const artist of ["卢广仲", "周杰伦", "林俊杰", "王力宏", "郭静", "梁静茹", "陈奕迅"]) {
    if (!musicText.includes(artist)) failures.push(`音乐页缺少歌手：${artist}`)
  }
  const spotifyPlayers = await page.locator('iframe[src*="open.spotify.com/embed/artist"]').count()
  if (spotifyPlayers < 7) failures.push("音乐页没有为常听歌手渲染多曲目 Spotify 播放器")
  results.push({ scope: "娱乐界面", route: "Steam 与音乐", ok: failures.length === before })
}

await checkEntertainmentApis()
await checkContentApis()
for (const route of publicRoutes) await visit(route, "公开页")
await checkEntertainmentUi()

if (username && password) {
  const api = await request.newContext({ baseURL })
  const login = await api.post("/api/auth/login", { data: { username, password } })
  if (!login.ok()) {
    failures.push(`后台登录接口失败: HTTP ${login.status()}`)
  } else {
    const payload = await login.json()
    const token = payload?.data?.token
    if (!token) {
      failures.push("后台登录接口未返回 token")
    } else {
      await page.addInitScript((value) => localStorage.setItem("portfolio-admin-token", value), token)
      for (const route of adminRoutes) await visit(route, "后台页")
      for (const modal of adminModalChecks) await checkAdminModal(modal)
      for (const route of retiredAdminRoutes) await checkRetiredAdminRoute(route)
    }
  }
  await api.dispose()
} else {
  results.push({ scope: "后台页", route: "全部", ok: true, skipped: "未提供后台测试环境变量" })
}

await browser.close()

for (const result of results) {
  const suffix = result.skipped ? `（跳过：${result.skipped}）` : ""
  console.log(`${result.ok ? "PASS" : "FAIL"} ${result.scope} ${result.route}${suffix}`)
}

if (failures.length) {
  console.error("\n检测到以下问题：")
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`\n生产环境冒烟测试通过：${baseURL}`)
