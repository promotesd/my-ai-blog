import { forwardRef } from "react"

export interface StaticImageData {
  src: string
  height?: number
  width?: number
  blurDataURL?: string
}

type ImageSource = string | StaticImageData

type ImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: ImageSource
  fill?: boolean
  priority?: boolean
  quality?: number
  sizes?: string
  unoptimized?: boolean
  placeholder?: string
  blurDataURL?: string
}

const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({ src, fill, priority: _priority, quality: _quality, unoptimized: _unoptimized, placeholder: _placeholder, blurDataURL: _blurDataURL, style, ...props }, ref) => {
    const resolvedSrc = typeof src === "string" ? src : src.src
    const resolvedStyle = fill
      ? { position: "absolute" as const, inset: 0, width: "100%", height: "100%", ...style }
      : style

    return <img ref={ref} src={resolvedSrc} style={resolvedStyle} {...props} />
  }
)

Image.displayName = "NextImageShim"

export default Image
