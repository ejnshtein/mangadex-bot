export default links => {
  return Object.keys(links).map(key => getLinkData(key, links[key]))
}

// function getLinkTitle (key) {
//   switch (key) {
//     case 'amz':
//       return 'Amazon.co.jp'
//     case 'mal':
//       return 'MyAnimeList'
//     case 'mu':
//       return 'MangaUpdates'
//     case 'nu':
//       return 'NovelUpdates'
//     default:
//       return key
//   }
// }

function getLinkData (key, value) {
  const linkTitle = linkKeys[key].title || key
  const link = linkKeys[key].url + value
  return {
    linkTitle,
    link
  }
}
const linkKeys = {
  'amz': {
    title: 'Amazon.co.jp',
    url: ''
  },
  'mal': {
    title: 'MyAnimeList',
    url: 'https://myanimelist.com/manga/'
  },
  'nu': {
    title: 'NovelUpdates',
    url: 'https://www.novelupdates.com/series/'
  },
  'bw': {
    title: 'Bookwalker',
    url: 'https://bookwalker.jp/'
  },
  'raw': {
    title: 'Raw',
    url: ''
  },
  'mu': {
    title: 'MangaUpdates',
    url: 'https://www.mangaupdates.com/series.html?id='
  },
  'ebj': {
    title: 'eBookJapan',
    url: ''
  },
  'engtl': {
    title: 'Official English',
    url: ''
  }
}
