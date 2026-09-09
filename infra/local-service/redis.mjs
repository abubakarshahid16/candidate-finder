import { createConnection } from 'node:net'

function encode(command) { return `*${command.length}\r\n${command.map(value => `$${Buffer.byteLength(String(value))}\r\n${value}\r\n`).join('')}` }
export function redisCommand(command, host = process.env.REDIS_HOST || 'redis', port = Number(process.env.REDIS_PORT || 6379)) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host, port }); let data = ''
    const timer = setTimeout(() => { socket.destroy(); reject(new Error('redis_timeout')) }, 1200)
    socket.on('connect', () => socket.write(encode(command)))
    socket.on('data', chunk => { data += chunk.toString(); if (data.includes('\r\n')) { clearTimeout(timer); socket.end(); resolve(parse(data)) } })
    socket.on('error', error => { clearTimeout(timer); reject(error) })
  })
}
function parse(value) { if (value.startsWith('-')) throw new Error(value.slice(1).trim()); if (value.startsWith(':')) return Number(value.split('\r\n')[0].slice(1)); if (value.startsWith('$-1')) return null; if (value.startsWith('$')) return value.split('\r\n')[1] || ''; return value }
