module.exports = app => {
  require('./manga')(app)
  require('./search')(app)
  require('./inline-query')(app)
  require('./chapter-page')(app)
  require('./chapter-list')(app)
  require('./delete')(app)
  require('./mark-as-read')(app)
}
