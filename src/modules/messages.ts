import { config } from '../../package.json'
import { Message } from '../views/components/message/types'

export class Messages {
  private file: nsIFile

  constructor() {
    this.file = this.initFile(OS.Path.join(Zotero.DataDirectory._dir, config.addonRef, 'messages.jsonl'))
  }

  private initFile(path: string) {
    const file = Components.classes['@mozilla.org/file/local;1'].createInstance(Components.interfaces.nsIFile)
    file.initWithPath(path)

    // Check if the parent directory exists, create if not
    let parentDir = file.parent
    if (!parentDir.exists()) {
      parentDir.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0o755)
    }

    // Check if the file exists, create if not
    if (!file.exists()) {
      file.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0o666)
    }

    return file
  }

  public loadMessages() {
    let messages = []

    let inputStream = Components.classes['@mozilla.org/network/file-input-stream;1'].createInstance(
      Components.interfaces.nsIFileInputStream
    )
    inputStream.init(this.file, 0x01, 0o444, 0) // read only

    let converterStream = Components.classes['@mozilla.org/intl/converter-input-stream;1'].createInstance(
      Components.interfaces.nsIConverterInputStream
    )
    converterStream.init(
      inputStream,
      'UTF-8',
      1024,
      Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER
    )

    let outStr: any = {}
    let line: any = '',
      hasMore
    do {
      hasMore = converterStream.readString(1024, outStr) // Read up to 1024 bytes at a time
      let part = outStr.value
      let lines = part.split('\n')
      lines[0] = line + lines[0]
      for (let i = 0; i < lines.length - 1; i++) {
        let line = lines[i].trim()
        if (line) {
          messages.push(JSON.parse(line))
        }
      }
      line = lines[lines.length - 1]
    } while (hasMore)

    converterStream.close()
    inputStream.close()

    return messages
  }

  public appendMessage(message: Message) {
    const messageLine = JSON.stringify(message) + '\n'

    // Open the file for appending
    const foStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(
      Components.interfaces.nsIFileOutputStream
    )
    foStream.init(this.file, 0x02 | 0x08 | 0x10, 0o666, 0) // 0x02: write, 0x08: create, 0x10: append

    // Create a converter stream for UTF-8 encoding
    const converterStream = Components.classes['@mozilla.org/intl/converter-output-stream;1'].createInstance(
      Components.interfaces.nsIConverterOutputStream
    )
    converterStream.init(foStream, 'UTF-8', 0, 0)

    // Write the message with a newline character
    converterStream.writeString(messageLine)

    // Close the converter stream and file stream
    converterStream.close()
  }

  public modifyMessage(messageIndex: number, updatedMessage: Message, trim = false) {
    const tempFile = this.file.clone()
    tempFile.leafName = 'temp_' + tempFile.leafName

    // Streams for reading the original file and writing to the temp file
    const inputStream = Components.classes['@mozilla.org/network/file-input-stream;1'].createInstance(
      Components.interfaces.nsIFileInputStream
    )
    const outputStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(
      Components.interfaces.nsIFileOutputStream
    )

    inputStream.init(this.file, 0x01, 0o444, 0) // read only
    outputStream.init(tempFile, 0x02 | 0x08 | 0x20, 0o666, 0) // write, create, truncate

    // Create a converter stream for UTF-8 encoding
    const converterStream = Components.classes['@mozilla.org/intl/converter-output-stream;1'].createInstance(
      Components.interfaces.nsIConverterOutputStream
    )
    converterStream.init(outputStream, 'UTF-8', 0, 0)

    const lineInputStream = inputStream.QueryInterface(Components.interfaces.nsILineInputStream)
    let line: any = {}
    let hasMore = false
    let currentLineIndex = 0

    do {
      hasMore = lineInputStream.readLine(line)

      // Replace the line if it's the edited one
      let lineToWrite = currentLineIndex === messageIndex ? JSON.stringify(updatedMessage) + '\n' : line.value + '\n'

      converterStream.writeString(lineToWrite)

      if (trim && currentLineIndex === messageIndex) {
        break // Stop writing after updating the required line if trim is true
      }
      currentLineIndex++
    } while (hasMore)

    inputStream.close()
    converterStream.close() // Closes the underlying file output stream as well

    // Replace the old file with the new file
    tempFile.moveTo(this.file.parent, this.file.leafName)
  }

  public clearMessages() {
    const foStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(
      Components.interfaces.nsIFileOutputStream
    )
    foStream.init(this.file, 0x02 | 0x20, 0o666, 0) // 0x02: write, 0x20: truncate

    // Close the file stream immediately to truncate the file
    foStream.close()
  }
}
