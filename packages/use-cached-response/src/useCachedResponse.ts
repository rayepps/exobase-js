import { hook, Props } from '@exobase/core'
import type { Duration } from 'durhuman'
import dur from 'durhuman'
import { crush, mapValues, tryit } from 'radash'
import * as uuid from 'uuid'

export interface ICache {
  get: (key: string) => Promise<string>
  /**
   * @param ttl number Seconds until the cached value should be considered stale
   */
  set: (key: string, value: string, ttl: number) => Promise<void>
}

export interface ICacheLogger {
  log: (...args: any[]) => void
  warn: (...args: any[]) => void
  error: (...args: any[]) => void
}

export type UseCachedResponseOptions<TArgs extends {} = {}, TResponse = any> = {
  /**
   * A string unique to the items you are using this hook to cache.
   * You'll likely want to use a unique key in every endpoint
   */
  key: string
  /**
   * Time to live: The amount of time before we should consider an
   * item in the cache to be fresh. The hook will ignore an item in
   * the cache if the TTL has passed.
   */
  ttl: Duration
  /**
   * If passed, the hook will log information about the caching using
   * this object. If nothing is passed the hook will be silent.
   */
  logger?: ICacheLogger
  /**
   * In some cases, it can be useful to override the cache and force
   * the endpoint to do the work again. Configure skipping to let a
   * request with a specific header value force the hook to skip the
   * cache and call the endpoint.
   */
  skipping?: {
    header: string
    value: string
  }
  /**
   * A mapping function to convert the args into an object that should
   * be used to generate the cache key.
   */
  toIdentity?: (args: TArgs) => any
  /**
   * A mapping function to convert a response object into a string that
   * can be stored in the cache. Defaults to JSON.stringify
   */
  toCache?: (response: TResponse) => string
  /**
   * A mapping function to convert a stored cache string back into a
   * response object. Defaults to JSON.parse
   */
  toResponse?: (cached: string) => TResponse
}

const defaults: Required<
  Pick<
    UseCachedResponseOptions,
    'ttl' | 'toIdentity' | 'toCache' | 'toResponse'
  >
> = {
  ttl: '1 hour',
  toIdentity: a => a,
  toCache: r => JSON.stringify(r),
  toResponse: c => JSON.parse(c)
}

const hash = <TObject extends object>(obj: TObject) =>
  uuid.v5(
    JSON.stringify(
      mapValues(crush(obj), (value: any) => {
        if (value === null) return '__null__'
        if (value === undefined) return '__undefined__'
        return value
      })
    ),
    uuid.v5.DNS
  )

export const useCachedResponse = (options: UseCachedResponseOptions) =>
  hook<
    Props<
      {},
      {
        cache: ICache
      }
    >,
    Props
  >(func => async props => {
    const {
      key: prefix,
      toIdentity,
      toResponse,
      toCache,
      skipping,
      logger,
      ttl
    } = { ...defaults, ...options }
    if (skipping) {
      const value = props.request.headers[skipping.header]
      if (value === skipping.value) {
        logger?.log(
          `[useCachedResponse] Skipping cache ${skipping.header}=${value}`
        )
        return await func(props)
      }
    }
    const key = `${prefix}.${hash(toIdentity(props.args))}`
    const [getErr, cached] = await tryit(props.services.cache.get)(key)
    if (getErr) {
      logger?.error(
        '[useCachedResponse] Error on GET, falling back to function',
        getErr
      )
    }
    if (cached) {
      logger?.log(`[useCachedResponse] Cache hit for key: ${key}`)
      return toResponse(cached)
    } else {
      logger?.log(`[useCachedResponse] Cache miss key: ${key}`)
    }
    const response = await func(props)
    const [setErr] = await tryit(props.services.cache.set)(
      key,
      toCache(response),
      dur(ttl, 'seconds')
    )
    if (setErr) {
      logger?.error(
        '[useCachedResponse] Error on SET, the function result was not persisted.',
        setErr
      )
    }
    return response
  })
