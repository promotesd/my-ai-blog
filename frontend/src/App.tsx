import { Navigate, Route, Routes, useParams } from "react-router-dom"
import PublicLayout from "@/components/layouts/PublicLayout"
import DashboardShell from "@/components/dashboard/DashboardShell"

import HomePage from "@/pages/page"
import AboutPage from "@/pages/about/page"
import SkillsPage from "@/pages/skills/page"
import ProjectsPage from "@/pages/projects/page"
import BlogsPage from "@/pages/blogs/page"
import BlogDetailPage from "@/pages/blogs/[id]/page"
import DiaryPage from "@/pages/diary/page"
import GuestbookPage from "@/pages/guestbook/page"
import GalleryPage from "@/pages/gallery/page"
import GalleryAlbumPage from "@/pages/gallery/album/[slug]/page"
import DeployProjectsPage from "@/pages/deploy-projects/page"
import DeployProjectDetailPage from "@/pages/deploy-projects/[slug]/page"
import ContactPage from "@/pages/contact/page"
import CertificatePage from "@/pages/certificate/page"
import EntertainmentPage from "@/pages/entertainment/page"
import TimelinePage from "@/pages/timeline/page"
import TechStackPage from "@/pages/tech-stack/page"
import CreditPage from "@/pages/credit/page"
import XhubPage from "@/pages/xhub/page"
import MaintenancePage from "@/pages/maintenance/page"

import DashboardHomePage from "@/pages/dashboard/page"
import DashboardBlogsPage from "@/pages/dashboard/blogs/page"
import DashboardBooksPage from "@/pages/dashboard/books/page"
import DashboardCertificatesPage from "@/pages/dashboard/certificates/page"
import DashboardCodingJourneyPage from "@/pages/dashboard/coding-journey/page"
import DashboardDeployProjectsPage from "@/pages/dashboard/deploy-projects/page"
import DashboardDiaryPage from "@/pages/dashboard/diary/page"
import DashboardGalleryPage from "@/pages/dashboard/gallery/page"
import DashboardGamesPage from "@/pages/dashboard/games/page"
import DashboardGuestbookPage from "@/pages/dashboard/guestbook/page"
import DashboardMusicPage from "@/pages/dashboard/music/page"
import DashboardPortfolioStatsPage from "@/pages/dashboard/portfolio-stats/page"
import DashboardProjectsPage from "@/pages/dashboard/projects/page"
import DashboardSkillsPage from "@/pages/dashboard/skills/page"
import DashboardTechToolsPage from "@/pages/dashboard/tech-tools/page"
import DashboardTimelinesPage from "@/pages/dashboard/timelines/page"
import DashboardVisitorIpLogsPage from "@/pages/dashboard/visitor-ip-logs/page"
import DashboardWorkExperiencesPage from "@/pages/dashboard/work-experiences/page"

function BlogDetailRoute() {
  const { id = "" } = useParams()
  return <BlogDetailPage params={{ id }} />
}

function GalleryAlbumRoute() {
  const { slug = "" } = useParams()
  return <GalleryAlbumPage params={{ slug }} />
}

function PublicRoutes() {
  return (
    <PublicLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/blogs/:id" element={<BlogDetailRoute />} />
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/guestbook" element={<GuestbookPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/album/:slug" element={<GalleryAlbumRoute />} />
        <Route path="/deploy-projects" element={<DeployProjectsPage />} />
        <Route path="/deploy-projects/:slug" element={<DeployProjectDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/certificate" element={<CertificatePage />} />
        <Route path="/entertainment" element={<EntertainmentPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/tech-stack" element={<TechStackPage />} />
        <Route path="/credit" element={<CreditPage />} />
        <Route path="/xhub" element={<XhubPage />} />
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </PublicLayout>
  )
}

function DashboardRoutes() {
  return (
    <DashboardShell>
      <Routes>
        <Route index element={<DashboardHomePage />} />
        <Route path="blogs" element={<DashboardBlogsPage />} />
        <Route path="books" element={<DashboardBooksPage />} />
        <Route path="certificates" element={<DashboardCertificatesPage />} />
        <Route path="coding-journey" element={<DashboardCodingJourneyPage />} />
        <Route path="deploy-projects" element={<DashboardDeployProjectsPage />} />
        <Route path="diary" element={<DashboardDiaryPage />} />
        <Route path="gallery" element={<DashboardGalleryPage />} />
        <Route path="games" element={<DashboardGamesPage />} />
        <Route path="guestbook" element={<DashboardGuestbookPage />} />
        <Route path="music" element={<DashboardMusicPage />} />
        <Route path="portfolio-stats" element={<DashboardPortfolioStatsPage />} />
        <Route path="projects" element={<DashboardProjectsPage />} />
        <Route path="skills" element={<DashboardSkillsPage />} />
        <Route path="tech-tools" element={<DashboardTechToolsPage />} />
        <Route path="timelines" element={<DashboardTimelinesPage />} />
        <Route path="visitor-ip-logs" element={<DashboardVisitorIpLogsPage />} />
        <Route path="work-experiences" element={<DashboardWorkExperiencesPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </DashboardShell>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/dashboard/*" element={<DashboardRoutes />} />
      <Route path="/*" element={<PublicRoutes />} />
    </Routes>
  )
}
