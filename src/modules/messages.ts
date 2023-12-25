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
    let lineBuffer = ''
    let hasMore
    try {
      do {
        hasMore = converterStream.readString(1024, outStr)
        lineBuffer += outStr.value

        while (lineBuffer.includes('\n')) {
          let eolIndex = lineBuffer.indexOf('\n')
          let line = lineBuffer.substring(0, eolIndex)
          lineBuffer = lineBuffer.substring(eolIndex + 1)

          if (line.trim()) {
            messages.push(JSON.parse(line.trim())) // Trim and parse the line
          }
        }
      } while (hasMore)
    } catch (e) {
      // Rename and clear the file
      const corruptedFilePath = OS.Path.join(
        Zotero.DataDirectory._dir,
        config.addonRef,
        `messages_corrupted_${new Date().valueOf()}.jsonl`
      )
      this.file.copyTo(null as any, `messages_corrupted_${new Date().valueOf()}.jsonl`)

      // Clear the original file
      const foStream = Components.classes['@mozilla.org/network/file-output-stream;1'].createInstance(
        Components.interfaces.nsIFileOutputStream
      )
      foStream.init(this.file, 0x02 | 0x20, 0o666, 0) // 0x02: write, 0x20: truncate
      foStream.close()
      const error = {
        code: 'load_message_history_error',
        file: corruptedFilePath,
      }
      return [
        {
          type: 'BOT_MESSAGE',
          widget: 'ERROR' as const,
          input: {
            error,
          },
          _raw: JSON.stringify(error),
        },
      ]
    } finally {
      converterStream.close()
      inputStream.close()
    }

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

    // Create a converter stream for reading UTF-8 encoding
    const converterInputStream = Components.classes['@mozilla.org/intl/converter-input-stream;1'].createInstance(
      Components.interfaces.nsIConverterInputStream
    )
    converterInputStream.init(
      inputStream,
      'UTF-8',
      1024,
      Components.interfaces.nsIConverterInputStream.DEFAULT_REPLACEMENT_CHARACTER
    )

    // Create a converter stream for writing UTF-8 encoding
    const converterOutputStream = Components.classes['@mozilla.org/intl/converter-output-stream;1'].createInstance(
      Components.interfaces.nsIConverterOutputStream
    )
    converterOutputStream.init(outputStream, 'UTF-8', 0, 0)

    let outStr: any = {}
    let lineBuffer = ''
    let currentLineIndex = 0
    let hasMore = true

    while (hasMore) {
      hasMore = converterInputStream.readString(1024, outStr)
      lineBuffer += outStr.value
      let eolIndex

      while ((eolIndex = lineBuffer.indexOf('\n')) >= 0) {
        // Extract a line
        let line = lineBuffer.substring(0, eolIndex)
        lineBuffer = lineBuffer.substring(eolIndex + 1)

        if (currentLineIndex === messageIndex) {
          // Replace the line with the updated message
          converterOutputStream.writeString(JSON.stringify(updatedMessage) + '\n')
          if (trim) {
            // If trimming, we stop writing any further lines
            lineBuffer = ''
            hasMore = false
            break
          }
        } else {
          // Write the line as is
          converterOutputStream.writeString(line + '\n')
        }
        currentLineIndex++
      }
    }

    // Write any remaining data in the buffer if not trimming
    if (lineBuffer && !trim) {
      converterOutputStream.writeString(lineBuffer)
    }

    // Close the streams
    converterInputStream.close() // Closes the underlying file input stream as well
    converterOutputStream.close() // Closes the underlying file output stream as well

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
