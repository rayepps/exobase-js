import { describe, expect, jest, test } from '@jest/globals'
import { tryit } from 'radash'
import { useJsonBody } from '../index'

describe('useJsonBody hooks', () => {
  test('parses body and applies values to args', async () => {
    const sut = useJsonBody(yup => ({
      id: yup.number(),
      name: yup.string()
    }))
    const endpointMock = jest.fn(p => p)
    const props = {
      request: {
        body: {
          id: 22,
          name: 'mock-nmame'
        }
      }
    }
    const result = await sut(endpointMock as any)(props as any)
    expect(endpointMock).toBeCalled()
    expect(result.args.id).toBe(props.request.body.id)
    expect(result.args.name).toBe(props.request.body.name)
  })
  test('throws correct error when validation fails', async () => {
    const sut = useJsonBody(yup => ({
      id: yup.number(),
      name: yup.string()
    }))
    const endpointMock = jest.fn(p => p)
    const props = {
      request: {
        body: {
          id: 22
          // name: 'mock-name'
        }
      }
    }
    const [error] = (await tryit(sut(endpointMock as any))(
      props as any
    )) as unknown as [Error]
    expect(error).not.toBeNull()
  })
})
