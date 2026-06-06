import { forwardRef } from "react"
import { Link as RouterLink, type LinkProps as RouterLinkProps } from "react-router-dom"

type NextLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Omit<RouterLinkProps, "to"> & {
    href: RouterLinkProps["to"]
    prefetch?: boolean
  }

const Link = forwardRef<HTMLAnchorElement, NextLinkProps>(
  ({ href, prefetch: _prefetch, children, ...props }, ref) => {
    const isExternal = typeof href === "string" && /^(https?:|mailto:|tel:|#)/.test(href)

    if (isExternal) {
      return (
        <a ref={ref} href={href as string} {...props}>
          {children}
        </a>
      )
    }

    return (
      <RouterLink ref={ref} to={href} {...props}>
        {children}
      </RouterLink>
    )
  }
)

Link.displayName = "NextLinkShim"

export default Link
