if (typeof Promise.allSettled === 'undefined') {
  Promise.allSettled = function (promises: any) {
    return Promise.all(
      promises.map((p: any) =>
        Promise.resolve(p).then(
          value => ({ status: 'fulfilled', value }),
          reason => ({ status: 'rejected', reason })
        )
      )
    )
  }
}
