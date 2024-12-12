const { classes: Cc, interfaces: Ci } = Components

export const crypto = {
  randomFillSync: function (buffer: any) {
    const randomGenerator = Cc['@mozilla.org/security/random-generator;1'].createInstance(Ci.nsIRandomGenerator)
    const randomBytes = randomGenerator.generateRandomBytes(buffer.length)

    for (let i = 0; i < randomBytes.length; i++) {
      buffer[i] = randomBytes[i]
    }
  },
}
