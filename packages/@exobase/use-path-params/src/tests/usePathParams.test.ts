import { describe, expect, test } from '@jest/globals'
import { parsePathParams as parse } from '../index'

describe('parsePathParams', () => {
  const workspace = 'w1'
  const account = 'a1'

  const request = {
    path: `/v1/show/${workspace}/account/${account}/details`
  }

  test('returns parsed params', async () => {
    expect(
      parse(request, '/v1/show/{workspace}/account/{account}/details')
    ).toStrictEqual({
      workspace,
      account
    })
  })

  test('throws error when path does not match', () => {
    const caught =
      (func: Function) =>
      (path: string): any => {
        try {
          func(request, path)
        } catch (err) {
          return err
        }
        return null
      }
    const p = caught(parse)
    expect(p('/v1/show/{workspace}/account/{account}')?.key).not.toBeNull()
    expect(p('/v1/show/{workspace}')?.key).not.toBeNull()
    expect(p('/v1/show/{workspace}/account')?.key).not.toBeNull()
    expect(p('/v1/show')?.key).not.toBeNull()
  })
})
