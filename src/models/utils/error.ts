export function anonymizeError(errorMessage: string) {
  return errorMessage.replace(/file:\/\/\/.*?\/extensions\//g, 'file:/<local-profile-dir>/extensions/')
}
