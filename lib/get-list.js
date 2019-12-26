export default list => fullList.get(list) || 'reading'
const fullList = new Map([['fav', 'favorite'], ['read', 'reading']])
