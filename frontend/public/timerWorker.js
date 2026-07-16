let intervalId = null
let endTime = null

self.onmessage = (e) => {
  const { type, endTime: newEndTime } = e.data
  if (type === 'START') {
    endTime = newEndTime
    clearInterval(intervalId)
    intervalId = setInterval(() => {
      if (Date.now() >= endTime) {
        clearInterval(intervalId)
        intervalId = null
        self.postMessage({ type: 'COMPLETE' })
      }
    }, 500)
  } else if (type === 'STOP') {
    clearInterval(intervalId)
    intervalId = null
    endTime = null
  }
}
