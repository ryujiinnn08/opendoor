/**
 * Turns { field: message } into the summary's list, in the order the fields appear.
 */
export function summaryFrom(fieldErrors, fieldOrder, generalError) {
  const list = fieldOrder.filter((id) => fieldErrors[id]).map((id) => ({ id, message: fieldErrors[id] }))
  const unknown = Object.keys(fieldErrors)
    .filter((id) => !fieldOrder.includes(id))
    .map((id) => ({ message: fieldErrors[id] }))
  return [...(generalError ? [{ message: generalError }] : []), ...list, ...unknown]
}
