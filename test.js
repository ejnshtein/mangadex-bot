const diff = (obj1, obj2) => {
  if (!obj2 || typeof obj2 !== 'object') {
    return obj1
  }
  const diffs = {}

  /**
   * Check if two arrays are equal
   * @param  {Array}   arr1 The first array
   * @param  {Array}   arr2 The second array
   * @return {Boolean}      If true, both arrays are equal
   */
  const arraysMatch = function (arr1, arr2) {
    // Check if the arrays are the same length
    if (arr1.length !== arr2.length) return false

    // Check if all items exist and are in the same order
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false
    }

    // Otherwise, return true
    return true
  }

  /**
   * Compare two items and push non-matches to object
   * @param  {*}      item1 The first item
   * @param  {*}      item2 The second item
   * @param  {String} key   The key in our object
   */
  const compare = function (item1, item2, key) {
    // Get the object type
    const type1 = Object.prototype.toString.call(item1)
    const type2 = Object.prototype.toString.call(item2)
    // console.log(type1, type2)

    // If type2 is undefined it has been removed
    if (type2 === '[object Undefined]') {
      return [key, null]
    }

    // If items are different types
    if (type1 !== type2) {
      return [key, item2]
    }

    // If an object, compare recursively
    if (type1 === '[object Object]') {
      const objDiff = diff(item1, item2)
      if (Object.keys(objDiff).length > 1) {
        return [key, objDiff]
      }
      return [key, undefined]
    }

    // If an array, compare
    if (type1 === '[object Array]') {
      if (!arraysMatch(item1, item2)) {
        return [key, item2]
      }
      return [key, undefined]
    }

    // Else if it's a function, convert to a string and compare
    // Otherwise, just compare
    if (type1 === '[object Function]') {
      if (item1.toString() !== item2.toString()) {
        return [key, item2]
      }
    } else {
      if (item1 !== item2) {
        return [key, item2]
      } else {
        return [key, undefined]
      }
    }
  }

  for (const key of Object.keys(obj1)) {
    if (obj1.hasOwnProperty(key)) {
      console.log(key)
      const [objKey, result] = compare(obj1[key], obj2[key], key)
      if (result) {
        diffs[objKey] = result
      }
    }
  }

  // Loop through the second object and find missing items
  for (const key in Object.keys(obj2)) {
    if (obj2.hasOwnProperty(key)) {
      if (!obj1[key] && obj1[key] !== obj2[key]) {
        diffs[key] = obj2[key]
      }
    }
  }

  console.log(diffs)
  // Return the object of differences
  return diffs
}

console.log(
  diff(
    {
      cover_url: '/images/manga/20882.jpg?1593446120',
      description:
        "[b][u]English[/u][/b]\r\nImagine waking to a world where every last human has been mysteriously turned to stone ...\r\nOne fateful day, all of humanity was petrified by a blinding flash of light. After several millennia, high schooler Taiju awakens and finds himself lost in a world of statues. However, he's not alone! His science-loving friend Senku's been up and running for a few months and he's got a grand plan in mind&mdash;to kickstart civilization with the power of science!\r\n\r\n[b][u]Russian / \u0420\u0443\u0441\u0441\u043a\u0438\u0439[/u][/b][spoiler]\r\n\u041e\u0434\u043d\u0430\u0436\u0434\u044b, \u043a\u043e\u0433\u0434\u0430 \u0422\u0430\u0439\u0434\u0436\u0443 \u043f\u044b\u0442\u0430\u043b\u0441\u044f \u0441\u043e\u0431\u0440\u0430\u0442\u044c\u0441\u044f \u0441 \u0434\u0443\u0445\u043e\u043c, \u0447\u0442\u043e\u0431\u044b \u043f\u0440\u0438\u0437\u043d\u0430\u0442\u044c\u0441\u044f \u0434\u0435\u0432\u0443\u0448\u043a\u0435 \u0432 \u043b\u044e\u0431\u0432\u0438, \u043d\u0435\u0431\u043e \u0437\u0430\u043f\u043e\u043b\u043d\u0438\u043b \u0441\u0442\u0440\u0430\u043d\u043d\u044b\u0439 \u0441\u0432\u0435\u0442. \u0412\u0441\u0435 \u043b\u044e\u0434\u0438, \u043d\u0430 \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u043e\u043d \u043f\u0430\u0434\u0430\u043b, \u043f\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u043b\u0438\u0441\u044c \u0432 \u043a\u0430\u043c\u0435\u043d\u044c. \u041f\u043e\u0441\u043b\u0435 \u0431\u0435\u0437 \u043c\u0430\u043b\u043e\u0433\u043e \u0447\u0435\u0442\u044b\u0440\u0451\u0445 \u0442\u044b\u0441\u044f\u0447 \u043b\u0435\u0442 \u043e\u043d \u043d\u0430\u043a\u043e\u043d\u0435\u0446 \u0432\u044b\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044f \u0438\u0437 \u043a\u0430\u043c\u0435\u043d\u043d\u043e\u0433\u043e \u043f\u043b\u0435\u043d\u0430 \u0438 \u043d\u0430\u0447\u0438\u043d\u0430\u0435\u0442 \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u0442\u044c \u043e\u043a\u0440\u0435\u0441\u0442\u043d\u043e\u0441\u0442\u0438. \u041d\u0435\u043e\u0436\u0438\u0434\u0430\u043d\u043d\u043e \u0422\u0430\u0439\u0434\u0436\u0443 \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u0442\u0441\u044f \u0435\u0433\u043e \u0441\u0442\u0430\u0440\u044b\u0439 \u0434\u0440\u0443\u0433 \u0421\u0435\u043d\u043a\u0443, \u043e\u0447\u043d\u0443\u0432\u0448\u0438\u0439\u0441\u044f \u043f\u043e\u043b\u0433\u043e\u0434\u0430 \u043d\u0430\u0437\u0430\u0434. \u0421\u0435\u043d\u043a\u0443 \u043f\u0440\u0438\u0432\u043e\u0434\u0438\u0442 \u0422\u0430\u0439\u0434\u0436\u0443 \u0432 \u0441\u0432\u043e\u0439 \u043f\u0440\u0438\u043c\u0438\u0442\u0438\u0432\u043d\u044b\u0439 \u0434\u043e\u043c \u043d\u0430 \u0434\u0435\u0440\u0435\u0432\u0435 \u0438 \u043f\u0440\u043e\u0441\u0438\u0442 \u043f\u043e\u043c\u043e\u0449\u0438 \u0432 \u0432\u043e\u0437\u0440\u043e\u0436\u0434\u0435\u043d\u0438\u0438 \u0438\u0441\u0447\u0435\u0437\u043d\u0443\u0432\u0448\u0435\u0439 \u0447\u0435\u043b\u043e\u0432\u0435\u0447\u0435\u0441\u043a\u043e\u0439 \u0446\u0438\u0432\u0438\u043b\u0438\u0437\u0430\u0446\u0438\u0438, \u043d\u0430\u0447\u0438\u043d\u0430\u044f \u0441 \u043f\u043e\u043f\u044b\u0442\u043e\u043a \u0432\u044b\u044f\u0441\u043d\u0438\u0442\u044c \u0438\u0441\u0442\u0438\u043d\u043d\u0443\u044e \u043f\u0440\u0438\u0440\u043e\u0434\u0443 \u0441\u0432\u0435\u0442\u0430, \u043a\u043e\u0442\u043e\u0440\u044b\u0439 \u043f\u0440\u0435\u0432\u0440\u0430\u0442\u0438\u043b \u043b\u044e\u0434\u0435\u0439 \u0432 \u043a\u0430\u043c\u0435\u043d\u044c.[/spoiler]\r\n\r\n[b][u]Portuguese / Portugu&ecirc;s[/u][/b][spoiler]\r\nImagina acordar em um mundo onde cada humano foi misteriosamente transformado em pedra... Em um dia fat&iacute;dico, toda a humanidade foi petrificada em um piscar de olhos. Depois de muitos mil&ecirc;nios, o aluno do ensino m&eacute;dio, Taiju, acorda e se encontra perdido em um mundo de est&aacute;tuas. Entretanto, ele n&atilde;o est&aacute; sozinho! Seu amigo que ama ci&ecirc;ncia, Senku, est&aacute; acordado e correndo pelos &uacute;ltimos meses e ele tem um grande plano em mente, recome&ccedil;ar a civiliza&ccedil;&atilde;o com o poder da ci&ecirc;ncia![/spoiler]",
      title: 'Dr. Stone',
      alt_names: [
        'Doktor Ta\u015f',
        'Dr. Batu',
        'Dr. Pedra',
        'Dr. Roca',
        'Dr.Stone',
        '\u0414\u043e\u043a\u0442\u043e\u0440 \u0421\u0442\u043e\u0443\u043d',
        '\u041f\u0440\u043e\u0444\u0435\u0441\u0441\u043e\u0440 \u043a\u0430\u043c\u0435\u043d\u043d\u043e\u0433\u043e \u0432\u0435\u043a\u0430',
        '\u30c9\u30af\u30bf\u30fc\u30b9\u30c8\u30fc\u30f3'
      ],
      artist: 'Boichi',
      author: 'Inagaki Riichiro',
      status: 1,
      genres: [2, 3, 5, 8, 25, 72],
      last_chapter: '0',
      lang_name: 'Japanese',
      lang_flag: 'jp',
      hentai: 0,
      links: {
        al: '98416',
        ap: 'dr-stone',
        bw: 'series/114645',
        kt: '38860',
        mu: '139601',
        amz: 'https://www.amazon.co.jp/gp/product/B075F8JBQ1',
        cdj: 'http://www.cdjapan.co.jp/product/NEOBK-2102546',
        ebj: 'https://www.ebookjapan.jp/ebj/413780/',
        mal: '103897',
        engtl: 'https://www.viz.com/dr-stone'
      },
      rating: {
        bayesian: '8.53',
        mean: '8.56',
        users: '1,456'
      }
    },
    {
      cover_url: '/images/manga/20882.jpg?1593446120',
      description:
        "[b][u]English[/u][/b]\r\nImagine waking to a world where every last human has been mysteriously turned to stone ...\r\nOne fateful day, all of humanity was petrified by a blinding flash of light. After several millennia, high schooler Taiju awakens and finds himself lost in a world of statues. However, he's not alone! His science-loving friend Senku's been up and running for a few months and he's got a grand plan in mind&mdash;to kickstart civilization with the power of science!\r\n\r\n[b][u]Russian / \u0420\u0443\u0441\u0441\u043a\u0438\u0439[/u][/b][spoiler]\r\n\u041e\u0434\u043d\u0430\u0436\u0434\u044b, \u043a\u043e\u0433\u0434\u0430 \u0422\u0430\u0439\u0434\u0436\u0443 \u043f\u044b\u0442\u0430\u043b\u0441\u044f \u0441\u043e\u0431\u0440\u0430\u0442\u044c\u0441\u044f \u0441 \u0434\u0443\u0445\u043e\u043c, \u0447\u0442\u043e\u0431\u044b \u043f\u0440\u0438\u0437\u043d\u0430\u0442\u044c\u0441\u044f \u0434\u0435\u0432\u0443\u0448\u043a\u0435 \u0432 \u043b\u044e\u0431\u0432\u0438, \u043d\u0435\u0431\u043e \u0437\u0430\u043f\u043e\u043b\u043d\u0438\u043b \u0441\u0442\u0440\u0430\u043d\u043d\u044b\u0439 \u0441\u0432\u0435\u0442. \u0412\u0441\u0435 \u043b\u044e\u0434\u0438, \u043d\u0430 \u043a\u043e\u0442\u043e\u0440\u044b\u0445 \u043e\u043d \u043f\u0430\u0434\u0430\u043b, \u043f\u0440\u0435\u0432\u0440\u0430\u0449\u0430\u043b\u0438\u0441\u044c \u0432 \u043a\u0430\u043c\u0435\u043d\u044c. \u041f\u043e\u0441\u043b\u0435 \u0431\u0435\u0437 \u043c\u0430\u043b\u043e\u0433\u043e \u0447\u0435\u0442\u044b\u0440\u0451\u0445 \u0442\u044b\u0441\u044f\u0447 \u043b\u0435\u0442 \u043e\u043d \u043d\u0430\u043a\u043e\u043d\u0435\u0446 \u0432\u044b\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044f \u0438\u0437 \u043a\u0430\u043c\u0435\u043d\u043d\u043e\u0433\u043e \u043f\u043b\u0435\u043d\u0430 \u0438 \u043d\u0430\u0447\u0438\u043d\u0430\u0435\u0442 \u0438\u0441\u0441\u043b\u0435\u0434\u043e\u0432\u0430\u0442\u044c \u043e\u043a\u0440\u0435\u0441\u0442\u043d\u043e\u0441\u0442\u0438. \u041d\u0435\u043e\u0436\u0438\u0434\u0430\u043d\u043d\u043e \u0422\u0430\u0439\u0434\u0436\u0443 \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u0435\u0442\u0441\u044f \u0435\u0433\u043e \u0441\u0442\u0430\u0440\u044b\u0439 \u0434\u0440\u0443\u0433 \u0421\u0435\u043d\u043a\u0443, \u043e\u0447\u043d\u0443\u0432\u0448\u0438\u0439\u0441\u044f \u043f\u043e\u043b\u0433\u043e\u0434\u0430 \u043d\u0430\u0437\u0430\u0434. \u0421\u0435\u043d\u043a\u0443 \u043f\u0440\u0438\u0432\u043e\u0434\u0438\u0442 \u0422\u0430\u0439\u0434\u0436\u0443 \u0432 \u0441\u0432\u043e\u0439 \u043f\u0440\u0438\u043c\u0438\u0442\u0438\u0432\u043d\u044b\u0439 \u0434\u043e\u043c \u043d\u0430 \u0434\u0435\u0440\u0435\u0432\u0435 \u0438 \u043f\u0440\u043e\u0441\u0438\u0442 \u043f\u043e\u043c\u043e\u0449\u0438 \u0432 \u0432\u043e\u0437\u0440\u043e\u0436\u0434\u0435\u043d\u0438\u0438 \u0438\u0441\u0447\u0435\u0437\u043d\u0443\u0432\u0448\u0435\u0439 \u0447\u0435\u043b\u043e\u0432\u0435\u0447\u0435\u0441\u043a\u043e\u0439 \u0446\u0438\u0432\u0438\u043b\u0438\u0437\u0430\u0446\u0438\u0438, \u043d\u0430\u0447\u0438\u043d\u0430\u044f \u0441 \u043f\u043e\u043f\u044b\u0442\u043e\u043a \u0432\u044b\u044f\u0441\u043d\u0438\u0442\u044c \u0438\u0441\u0442\u0438\u043d\u043d\u0443\u044e \u043f\u0440\u0438\u0440\u043e\u0434\u0443 \u0441\u0432\u0435\u0442\u0430, \u043a\u043e\u0442\u043e\u0440\u044b\u0439 \u043f\u0440\u0435\u0432\u0440\u0430\u0442\u0438\u043b \u043b\u044e\u0434\u0435\u0439 \u0432 \u043a\u0430\u043c\u0435\u043d\u044c.[/spoiler]\r\n\r\n[b][u]Portuguese / Portugu&ecirc;s[/u][/b][spoiler]\r\nImagina acordar em um mundo onde cada humano foi misteriosamente transformado em pedra... Em um dia fat&iacute;dico, toda a humanidade foi petrificada em um piscar de olhos. Depois de muitos mil&ecirc;nios, o aluno do ensino m&eacute;dio, Taiju, acorda e se encontra perdido em um mundo de est&aacute;tuas. Entretanto, ele n&atilde;o est&aacute; sozinho! Seu amigo que ama ci&ecirc;ncia, Senku, est&aacute; acordado e correndo pelos &uacute;ltimos meses e ele tem um grande plano em mente, recome&ccedil;ar a civiliza&ccedil;&atilde;o com o poder da ci&ecirc;ncia![/spoiler]",
      title: 'Dr. Stone',
      alt_names: [
        'Doktor Ta\u015f',
        'Dr. Batu',
        'Dr. Pedra',
        'Dr. Roca',
        'Dr.Stone',
        '\u0414\u043e\u043a\u0442\u043e\u0440 \u0421\u0442\u043e\u0443\u043d',
        '\u041f\u0440\u043e\u0444\u0435\u0441\u0441\u043e\u0440 \u043a\u0430\u043c\u0435\u043d\u043d\u043e\u0433\u043e \u0432\u0435\u043a\u0430',
        '\u30c9\u30af\u30bf\u30fc\u30b9\u30c8\u30fc\u30f3'
      ],
      artist: 'Boichi',
      author: 'Inagaki Riichiro',
      status: 1,
      genres: [2, 3, 5, 8, 25, 72],
      last_chapter: '0',
      lang_name: 'Japanese',
      lang_flag: 'jp',
      hentai: 0,
      links: {
        al: '98416',
        ap: 'dr-stone',
        bw: 'series/114645',
        kt: '38860',
        mu: '139601',
        amz: 'https://www.amazon.co.jp/gp/product/B075F8JBQ1',
        cdj: 'http://www.cdjapan.co.jp/product/NEOBK-2102546',
        ebj: 'https://www.ebookjapan.jp/ebj/413780/',
        mal: '103897',
        engtl: 'https://www.viz.com/dr-stone'
      },
      rating: {
        bayesian: '7.53',
        mean: '8.56',
        users: '1,456'
      }
    }
  )
)
