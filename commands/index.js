module.exports = app => {
  require('./start')(app)
  require('./search')(app)
  require('./get-cache-pool')(app)
  require('./link-detector')(app)
}
