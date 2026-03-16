/**
 * Shim for next/dynamic → React.lazy.
 *
 * next/dynamic is essentially React.lazy + Suspense with an `ssr: false`
 * option (irrelevant in a SPA). This shim supports the common usage:
 *
 *   const Plot = dynamic(() => import('./Plot'), { ssr: false })
 */
import { type ComponentType, Suspense, lazy } from 'react';

interface DynamicOptions {
  ssr?: boolean;
  loading?: ComponentType;
}

export default function dynamic<P extends object>(
  loader: () => Promise<{ default: ComponentType<P> }>,
  options?: DynamicOptions
): ComponentType<P> {
  const LazyComponent = lazy(loader);
  const LoadingComponent = options?.loading;

  const DynamicComponent = (props: P) => (
    <Suspense fallback={LoadingComponent ? <LoadingComponent /> : null}>
      <LazyComponent {...props} />
    </Suspense>
  );

  DynamicComponent.displayName = 'Dynamic';
  return DynamicComponent;
}
