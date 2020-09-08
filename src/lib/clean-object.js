export default (object, filterKeys = []) => Object.entries(object)
  .reduce(
    (acc, [key, value]) => filterKeys.includes(key) ? { ...acc, [key]: value } : acc,
    {}
  )
