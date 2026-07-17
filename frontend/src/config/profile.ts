export const PROFILE = {
  displayName: "小嘟嘟",
  englishName: "profighted",
  githubUrl: "https://github.com/promotesd",
  email: "1412822254@qq.com",
  avatarUrl: "/profile/avatar.png",
  resumeUrl: "",
  undergraduate: "福州大学 数字媒体技术专业",
  graduate: "哈尔滨工程大学 智能科学与技术专业",
  researchFocus: ["Visual/LiDAR SLAM", "Robot Navigation"],
} as const

export const hasResume = Boolean(PROFILE.resumeUrl)
