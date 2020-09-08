export const cleanObject = (obj: any, keys: string[]) =>
  Object.entries(obj)
    .filter(([key]) => keys.includes(key))
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
