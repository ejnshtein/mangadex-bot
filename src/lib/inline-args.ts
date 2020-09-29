import { access } from 'fs'
import { parse, stringify } from 'querystring'

export const parseInlineArguments = (
  str: string,
  defaults: Record<string, any> = {}
): Record<string, any> => {
  const result = {}

  const parsedResult = parse(str, '&', '=')

  if (Object.keys(defaults).length > 0) {
    for (const [key, value] of Object.entries(defaults)) {
      if (key in parsedResult) {
        result[key] = parsedResult[key]
      } else {
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

  const cleanObject = Object.entries(obj)
    .filter(([key, val]) => Boolean(val))
    .reduce((acc, [key, val]) => ({ ...acc, [key]: val }), {})

  return stringify(cleanObject, '&', '=')
}

export const buildCallbackData = (
  name: string,
  args: Record<string, any>
): string => `${name}:${stringifyInlineArguments(args)}`
