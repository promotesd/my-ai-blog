import { lazy, Suspense } from "react"

type Loader<TProps> = () => Promise<{ default: React.ComponentType<TProps> } | React.ComponentType<TProps>>

interface DynamicOptions {
  loading?: React.ComponentType
  ssr?: boolean
}

export default function dynamic<TProps extends object>(
  loader: Loader<TProps>,
  options: DynamicOptions = {}
) {
  const Component = lazy(async () => {
    const loaded = await loader()
    return "default" in loaded ? loaded : { default: loaded }
  })

  return function DynamicComponent(props: TProps) {
    const Loading = options.loading
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <Component {...props} />
      </Suspense>
    )
  }
}
