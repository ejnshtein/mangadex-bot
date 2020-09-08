import { diff } from './diff'

export const hasDifference = (obj1, obj2): boolean => {
  return Object.keys(diff(obj1, obj2)).length > 0
}
