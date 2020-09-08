import { parse, stringify } from 'querystring'

export const parseInlineArguments = (
  str: string,
  defaults: { [key: string]: any } = {}
): Record<string, any> => {
  const result = parse(str, '&', '=')

  if (Object.keys(defaults).length > 0) {
    for (const [key, value] of Object.entries(defaults)) {
      if (!result.hasOwnProperty(key)) {
        result[key] = value
      }
    }
  }

  return result
}

export const stringifyInlineArguments = (
  args: Record<string, any>,
  defaults: { [key: string]: any } = {}
): string => {
  const obj = { ...args }

  if (Object.keys(defaults).length > 0) {
    for (const [key, value] of Object.entries(defaults)) {
      if (!obj.hasOwnProperty(key)) {
        obj[key] = value
      }
    }
  }

  return stringify(obj)
}
