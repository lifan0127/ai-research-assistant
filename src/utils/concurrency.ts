import { FILE_UPLOAD_CONCURRENCY } from "./constants"

export async function concurrencyPool<T>(
  items: T[],
  worker: (item: T, index: number) => Promise<void>,
  poolSize = FILE_UPLOAD_CONCURRENCY,
) {
  return new Promise<void>((resolve, reject) => {
    let inFlight = 0       // how many uploads (or tasks) are currently in flight
    let currentIndex = 0   // which item from the array is about to be processed
    let completed = 0      // how many items have completed processing

    function next() {
      // Start tasks while we have capacity AND unprocessed items remain
      while (inFlight < poolSize && currentIndex < items.length) {
        const itemIndex = currentIndex++
        inFlight++

        worker(items[itemIndex], itemIndex)
          .then(() => {
            inFlight--
            completed++

            // If all items have completed, we're done
            if (completed === items.length) {
              resolve()
            } else {
              // Otherwise, schedule more
              next()
            }
          })
          .catch((err) => {
            reject(err)
          })
      }
    }

    next() // kick off the first batch
  })
}