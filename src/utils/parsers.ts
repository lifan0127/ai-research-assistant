export function parsePartialJson(s: string, parser = JSON.parse): any {
  // If the input is undefined, return null.
  if (typeof s === "undefined") {
    return null
  }

  // First try parsing the string as-is.
  try {
    return JSON.parse(s)
  } catch (error) {
    // Fall back to our partial parsing approach.
  }

  let new_s = ""
  const stack: string[] = []
  let isInsideString = false
  let escaped = false
  // validEnd will record the position where the JSON value is complete.
  let validEnd = 0

  // Process each character of the string.
  for (let i = 0; i < s.length; i++) {
    let char = s[i]

    if (isInsideString) {
      if (char === '"' && !escaped) {
        isInsideString = false
      } else if (char === "\n" && !escaped) {
        char = "\\n" // replace newline with escape sequence
      } else if (char === "\\") {
        escaped = !escaped
      } else {
        escaped = false
      }
    } else {
      if (char === '"') {
        isInsideString = true
        escaped = false
      } else if (char === "{") {
        stack.push("}")
      } else if (char === "[") {
        stack.push("]")
      } else if (char === "}" || char === "]") {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop()
          // If the stack is now empty, record that we have a complete JSON value.
          if (stack.length === 0) {
            validEnd = i + 1
          }
        } else {
          // If stack is empty, treat extra closing symbols as trailing noise.
          if (stack.length === 0) {
            continue
          } else {
            // Otherwise, it's truly malformed.
            return null
          }
        }
      }
    }
    new_s += char
  }

  // If we're still inside a string, close it.
  if (isInsideString) {
    new_s += '"'
  }

  // If we found a valid complete JSON value earlier, truncate to that part.
  if (validEnd > 0) {
    new_s = new_s.substring(0, validEnd)
  } else {
    // Otherwise, append any missing closing tokens.
    for (let i = stack.length - 1; i >= 0; i--) {
      new_s += stack[i]
    }
  }

  try {
    return parser(new_s)
  } catch (error) {
    return null
  }
}
