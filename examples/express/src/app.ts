import express from 'express'
import { toInt } from 'radash'
import ping from './endpoints/ping'
import clearTimeout from './endpoints/v1/timeout/clear'
import createTimeout from './endpoints/v1/timeout/create'
import findTimeout from './endpoints/v1/timeout/find'
import listTimeouts from './endpoints/v1/timeout/list'

const app = express()
const port = toInt(process.env.PORT, 8500)

const endpoints = [ping, clearTimeout, findTimeout, createTimeout, listTimeouts]

for (const endpoint of endpoints) {
  switch (endpoint.config.method) {
    case 'GET':
      app.get(endpoint.config.path, endpoint.handler)
    case 'POST':
      app.post(endpoint.config.path, endpoint.handler)
    case 'PUT':
      app.put(endpoint.config.path, endpoint.handler)
  }
}

app.listen(port, () => {
  console.log(`Callback API listening on port ${port}`)
})
