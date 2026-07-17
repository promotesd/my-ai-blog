import { useEffect, useState } from "react"
import { getResumeStatus, type ResumeStatus } from "@/services/resumeApi"

const EMPTY_STATUS: ResumeStatus = {
  uploaded: false,
  url: "",
  filename: "",
  updatedAt: 0,
}

export function useResumeStatus() {
  const [status, setStatus] = useState<ResumeStatus>(EMPTY_STATUS)
  const [loading, setLoading] = useState(true)

  async function refresh() {
    setLoading(true)
    try {
      setStatus(await getResumeStatus())
    } catch {
      setStatus(EMPTY_STATUS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  return { status, loading, refresh }
}
