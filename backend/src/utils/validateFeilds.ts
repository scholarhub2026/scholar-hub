import mongoose from "mongoose"

export const validateRequiredFeilds = (
  body: Record<string, any>,
  fields: string[]
): string | null => {
  const missingFields: string[] = []

  for (const field of fields) {
    if (field.includes('.')) {
      const [arrayKey, nestedKey] = field.split('.')

      if (!Array.isArray(body[arrayKey]) || body[arrayKey].length === 0) {
        missingFields.push(`${nestedKey} is missing in ${arrayKey}`)
        continue
      }

      body[arrayKey].forEach((item: any, index: number) => {
        if (
          item[nestedKey] === undefined ||
          item[nestedKey] === null ||
          item[nestedKey] === ''
        ) {
          missingFields.push(`${arrayKey}[${index}].${nestedKey}`)
        }
      })
    } else {
      if (
        body[field] === undefined ||
        body[field] === null ||
        body[field] === ''
      ) {
        missingFields.push(field)
      }
    }
  }

  if (missingFields.length > 0) {
    return `Missing required field(s): ${missingFields.join(', ')}`
  }

  return null
}


export const mongooseIdValidator = (id: mongoose.Types.ObjectId) => {
  return mongoose.Types.ObjectId.isValid(id)
}