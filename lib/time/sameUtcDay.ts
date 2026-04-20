export const toUtcDay = (value: Date | string) =>
  new Date(value).toISOString().slice(0, 10)

export const isSameUtcDay = (a: Date | string, b: Date | string) =>
  toUtcDay(a) === toUtcDay(b)
