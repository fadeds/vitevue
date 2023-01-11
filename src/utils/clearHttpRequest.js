export let httpRequestList = []

export const clearHttpRequestingList = () => {
  if (httpRequestList.length > 0) {
    httpRequestList.forEach((item) => {
      item()
    })
    httpRequestList = []
  }
}
