function encode (text) {
  return Buffer.from(text).toString('base64')
}
function decode (buffer) {
  return Buffer.from(buffer, 'base64').toString('ascii')
}

export default {
  encode,
  decode
}
