import type { Props } from '@exobase/core'
import { useExpress } from '@exobase/use-express'
import { compose } from 'radash'
import * as t from '../types'

type Args = {}
type Services = {}
type Response = {
  message: 'pong'
}

export const pingEndpoint = async ({}: Props<
  Args,
  Services
>): Promise<Response> => ({
  message: 'pong'
})

const endpoint: t.Endpoint = {
  handler: compose(useExpress(), pingEndpoint),
  config: {
    method: 'GET',
    path: '/ping'
  }
}

export default endpoint
