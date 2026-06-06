import { useLocation, useNavigate, useParams as useRouterParams, useSearchParams as useRouterSearchParams } from "react-router-dom"

export function usePathname() {
  return useLocation().pathname
}

export function useRouter() {
  const navigate = useNavigate()

  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
    prefetch: (_href: string) => undefined,
  }
}

export function useParams<T extends Record<string, string | string[]> = Record<string, string>>() {
  return useRouterParams() as T
}

export function useSearchParams() {
  const [params] = useRouterSearchParams()
  return params
}

export function notFound(): never {
  throw new Error("Route not found")
}
