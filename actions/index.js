module.exports = app => {
  require('./manga')(app)
  require('./manga-cache')(app)
  require('./search')(app)
  require('./inline-query')(app)
  require('./chapter-page')(app)
  require('./chapter-list')(app)
  require('./delete')(app)
  require('./mark-as-read')(app)
  require('./choosen-inline-query')(app)
  require('./reading-list')(app)
  require('./favorite-title')(app)
  require('./favorite-list')(app)
  // require('./manga-updates')(app)
  require('./share')(app)
}
