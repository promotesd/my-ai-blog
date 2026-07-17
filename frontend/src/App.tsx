import { Navigate, Route, Routes, useParams } from "react-router-dom"
import PublicLayout from "@/components/layouts/PublicLayout"
import DashboardShell from "@/components/dashboard/DashboardShell"

import HomePage from "@/pages/page"
import ProjectsPage from "@/pages/projects/page"
import BlogsPage from "@/pages/blogs/page"
import BlogDetailPage from "@/pages/blogs/[id]/page"
import DiaryPage from "@/pages/diary/page"
import GuestbookPage from "@/pages/guestbook/page"
import GalleryPage from "@/pages/gallery/page"
import GalleryAlbumPage from "@/pages/gallery/album/[slug]/page"
import ContactPage from "@/pages/contact/page"
import EntertainmentPage from "@/pages/entertainment/page"
import TimelinePage from "@/pages/timeline/page"
import XhubPage from "@/pages/xhub/page"
import MaintenancePage from "@/pages/maintenance/page"

import DashboardHomePage from "@/pages/dashboard/page"
import DashboardBlogsPage from "@/pages/dashboard/blogs/page"
import DashboardDiaryPage from "@/pages/dashboard/diary/page"
import DashboardGalleryPage from "@/pages/dashboard/gallery/page"
import DashboardGuestbookPage from "@/pages/dashboard/guestbook/page"
import DashboardProjectsPage from "@/pages/dashboard/projects/page"
import DashboardResumePage from "@/pages/dashboard/resume/page"
import DashboardTimelinesPage from "@/pages/dashboard/timelines/page"

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
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/skills" element={<Navigate to="/about" replace />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/blogs" element={<BlogsPage />} />
        <Route path="/blogs/:id" element={<BlogDetailRoute />} />
        <Route path="/diary" element={<DiaryPage />} />
        <Route path="/guestbook" element={<GuestbookPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/gallery/album/:slug" element={<GalleryAlbumRoute />} />
        <Route path="/deploy-projects" element={<Navigate to="/projects" replace />} />
        <Route path="/deploy-projects/:slug" element={<Navigate to="/projects" replace />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/certificate" element={<Navigate to="/about" replace />} />
        <Route path="/entertainment" element={<EntertainmentPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/tech-stack" element={<Navigate to="/about" replace />} />
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
        <Route path="certificates" element={<Navigate to="/dashboard" replace />} />
        <Route path="coding-journey" element={<Navigate to="/dashboard" replace />} />
        <Route path="deploy-projects" element={<Navigate to="/dashboard" replace />} />
        <Route path="diary" element={<DashboardDiaryPage />} />
        <Route path="gallery" element={<DashboardGalleryPage />} />
        <Route path="guestbook" element={<DashboardGuestbookPage />} />
        <Route path="books" element={<Navigate to="/dashboard" replace />} />
        <Route path="games" element={<Navigate to="/dashboard" replace />} />
        <Route path="music" element={<Navigate to="/dashboard" replace />} />
        <Route path="portfolio-stats" element={<Navigate to="/dashboard" replace />} />
        <Route path="projects" element={<DashboardProjectsPage />} />
        <Route path="resume" element={<DashboardResumePage />} />
        <Route path="skills" element={<Navigate to="/dashboard" replace />} />
        <Route path="tech-tools" element={<Navigate to="/dashboard" replace />} />
        <Route path="timelines" element={<DashboardTimelinesPage />} />
        <Route path="visitor-ip-logs" element={<Navigate to="/dashboard" replace />} />
        <Route path="work-experiences" element={<Navigate to="/dashboard" replace />} />
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
