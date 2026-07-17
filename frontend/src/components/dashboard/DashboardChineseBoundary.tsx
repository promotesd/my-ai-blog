import { useEffect, useRef, type ReactNode } from "react"

const EXACT_TEXT: Record<string, string> = {
  Dashboard: "后台管理",
  Overview: "概览",
  Search: "搜索",
  Filter: "筛选",
  All: "全部",
  Actions: "操作",
  Action: "操作",
  Status: "状态",
  Title: "标题",
  Description: "描述",
  Category: "分类",
  Date: "日期",
  Image: "图片",
  Upload: "上传",
  Save: "保存",
  Cancel: "取消",
  Close: "关闭",
  Edit: "编辑",
  Delete: "删除",
  Create: "新建",
  Update: "更新",
  Loading: "加载中",
  Previous: "上一页",
  Next: "下一页",
  Photos: "照片",
  Photo: "照片",
  Albums: "相册",
  Album: "相册",
  Guests: "访客",
  Guest: "访客",
  Projects: "项目",
  Project: "项目",
  Blogs: "博客",
  Blog: "博客",
  Diary: "日记",
  Music: "音乐",
  Games: "游戏",
  Books: "书籍",
  Resume: "简历",
  Timeline: "时间线",
  Published: "已发布",
  published: "已发布",
  Draft: "草稿",
  draft: "草稿",
  Visible: "显示",
  Hidden: "隐藏",
  blue: "蓝色",
  orange: "橙色",
  green: "绿色",
  yellow: "黄色",
  purple: "紫色",
  red: "红色",
  cyan: "青色",
  Pendidikan: "教育",
  Karir: "工作",
  Magang: "实习",
  Personal: "个人",
  Visitor: "访客",
  "No Image": "暂无图片",
  "No data": "暂无数据",
  "No Data": "暂无数据",
  "No Notifications Yet": "暂无通知",
  "Select All": "全选",
  "Clear filters": "清除筛选",
  "Clear All": "全部清除",
  "Add New": "新建",
  "Add Photo": "添加照片",
  "Add Album": "添加相册",
  "Add Guest": "添加访客",
  "New Game Entry": "添加游戏",
  "Edit Game": "编辑游戏",
  "Cover Preview": "封面预览",
  "Playing": "游玩中",
  "Completed": "已完成",
  "Wishlist": "愿望单",
  "All Status": "全部状态",
  "All Categories": "全部分类",
  "All Platforms": "全部平台",
  "All Years": "全部年份",
  "View Site": "查看网站",
  "Timeline & Journey": "时间线管理",
  "New Entry": "新建记录",
  "Music Manager": "音乐管理",
  "Games Library": "游戏库",
  "Add Game": "添加游戏",
  "Track Info": "歌曲信息",
  "Game Info": "游戏信息",
  "Playlist Name": "歌单名称",
  "Spotify Connected": "已关联 Spotify",
  "Total Entri": "记录总数",
  "Status Selesai": "已完成",
  "Karir & Magang": "工作与实习",
  "Total Game": "游戏总数",
  "Sedang Dimainkan": "游玩中",
  "Tamat (Completed)": "已完成",
  "Informasi Dasar": "基本信息",
  "Waktu & Lokasi": "时间与地点",
  "Poin Penting & Keahlian": "重点与能力",
  "Media & Tampilan": "媒体与展示",
  "Media & Image": "图片资源",
  "Create new album": "创建新相册",
  "Album Name": "相册名称",
  "Album Slug": "相册标识",
  "Status Approval": "审核状态",
  "Featured / Unggulan": "设为精选",
  "Personal (Saya)": "个人（小嘟嘟）",
  "Guest (Tamu)": "访客",
  "Approved": "已通过",
  "Pending": "待审核",
  "Reset": "重置",
  "Reset filter": "重置筛选",
}

const REPLACEMENTS: Array<[RegExp, string]> = [
  [/Kelola/g, "管理"],
  [/Tambah/g, "添加"],
  [/Buat Baru/g, "新建"],
  [/Simpan Perubahan/g, "保存修改"],
  [/Simpan/g, "保存"],
  [/Batal/g, "取消"],
  [/Hapus/g, "删除"],
  [/Ubah/g, "编辑"],
  [/Cari/g, "搜索"],
  [/Semua/g, "全部"],
  [/Tidak ada data/g, "暂无数据"],
  [/Tidak ada/g, "暂无"],
  [/Belum ada/g, "暂无"],
  [/Gagal memuat data/g, "加载数据失败"],
  [/Gagal menghapus/g, "删除失败"],
  [/Gagal menyimpan/g, "保存失败"],
  [/berhasil dihapus/g, "已删除"],
  [/berhasil disimpan/g, "已保存"],
  [/Pilih/g, "选择"],
  [/Judul/g, "标题"],
  [/Deskripsi/g, "描述"],
  [/Kategori/g, "分类"],
  [/Tanggal/g, "日期"],
  [/Informasi/g, "信息"],
  [/Nama/g, "名称"],
  [/Tipe/g, "类型"],
  [/Pemilik/g, "所有者"],
  [/Unggulan/g, "精选"],
  [/Cerita/g, "说明"],
  [/Pengambilan/g, "拍摄"],
  [/Perangkat/g, "设备"],
  [/Lokasi/g, "地点"],
  [/Periode/g, "时间段"],
  [/Warna Tema/g, "主题颜色"],
  [/Poin Utama/g, "重点"],
  [/Keahlian/g, "能力"],
  [/Tanggung Jawab/g, "职责"],
  [/Ekstrakurikuler/g, "课外活动"],
  [/Pendidikan/g, "教育"],
  [/Karir/g, "工作"],
  [/Magang/g, "实习"],
  [/Terdaftar/g, "注册时间"],
  [/Jumlah/g, "数量"],
  [/Dalam/g, "所属"],
  [/Aksi/g, "操作"],
  [/Entri/g, "记录"],
  [/entri/g, "记录"],
  [/Menampilkan/g, "显示"],
  [/dari/g, "共"],
  [/Wajib diisi/g, "必填"],
  [/Tekan Enter/g, "按回车添加"],
  [/Ketik/g, "输入"],
  [/lalu tekan Enter/g, "后按回车"],
  [/Otomatis/g, "自动"],
  [/terisi setelah upload/g, "在上传后填写"],
  [/Biarkan sama jika tidak ada thumbnail khusus/g, "没有单独缩略图时保持与原图一致"],
  [/Cth:/g, "例如："],
  [/Sedang Berlangsung/g, "进行中"],
  [/Selesai/g, "已完成"],
  [/Pengunjung/g, "访客"],
  [/Tamu/g, "访客"],
  [/Foto/g, "照片"],
  [/Gambar/g, "图片"],
  [/Game/g, "游戏"],
  [/Buku/g, "书籍"],
  [/Lagu/g, "歌曲"],
  [/Album/g, "相册"],
  [/Catatan/g, "备注"],
  [/Tahun/g, "年份"],
  [/Bulan/g, "月份"],
  [/Halaman/g, "页"],
  [/Tampilkan/g, "显示"],
  [/Dipublikasikan/g, "已发布"],
  [/Draf/g, "草稿"],
  [/New /g, "新建"],
  [/Edit /g, "编辑"],
  [/Delete /g, "删除"],
  [/Manage /g, "管理"],
  [/Upload /g, "上传"],
  [/Search /g, "搜索"],
  [/Filter /g, "筛选"],
  [/Total /g, "总"],
  [/Timeline/g, "时间线"],
  [/Project/g, "项目"],
  [/Photo/g, "照片"],
  [/Guest/g, "访客"],
  [/Track/g, "歌曲"],
  [/Playlist/g, "歌单"],
  [/Album/g, "相册"],
  [/Slug/g, "标识"],
  [/Media/g, "媒体"],
  [/Info/g, "信息"],
  [/Rating/g, "评分"],
  [/Playtime/g, "游玩时间"],
  [/Cover/g, "封面"],
  [/Selected/g, "已选择"],
  [/items?/gi, "项"],
]

function translate(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return value
  const exact = EXACT_TEXT[trimmed]
  if (exact) return value.replace(trimmed, exact)
  return REPLACEMENTS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
}

function localizeElement(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    const node = root as Text
    const translated = translate(node.data)
    if (translated !== node.data) node.data = translated
    return
  }
  if (!(root instanceof Element)) return
  for (const attribute of ["placeholder", "title", "aria-label"]) {
    const value = root.getAttribute(attribute)
    if (value) root.setAttribute(attribute, translate(value))
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let node = walker.nextNode()
  while (node) {
    const text = node as Text
    const translated = translate(text.data)
    if (translated !== text.data) text.data = translated
    node = walker.nextNode()
  }
}

export default function DashboardChineseBoundary({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    localizeElement(root)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach(localizeElement)
        if (mutation.type === "characterData") localizeElement(mutation.target)
      })
    })
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])

  return <div ref={ref} className="contents" lang="zh-CN">{children}</div>
}
