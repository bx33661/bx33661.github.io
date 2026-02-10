const text = "这是一段测试文本，用于测试阅读时间的计算是否正确。".repeat(50) // 25 * 50 = 1250 chars

function readingTime(html) {
    const textOnly = html.replace(/<[^>]+>/g, '')
    const wordCount = textOnly.split(/\s+/).length
    const readingTimeMinutes = (wordCount / 200 + 1).toFixed()
    return `${readingTimeMinutes} 分钟阅读`
}

console.log(`Original Text Length: ${text.length}`)
console.log(`Original Logic Result: ${readingTime(text)}`)

function newReadingTime(html) {
    const textOnly = html.replace(/<[^>]+>/g, '')
    const cjkCount = (textOnly.match(/[\u4e00-\u9fa5]/g) || []).length
    const nonCjkText = textOnly.replace(/[\u4e00-\u9fa5]/g, ' ')
    const nonCjkCount = nonCjkText.split(/\s+/).filter(Boolean).length
    const totalCount = cjkCount + nonCjkCount
    const readingTimeMinutes = Math.ceil(totalCount / 300) || 1
    return `${readingTimeMinutes} 分钟阅读`
}

console.log(`New Logic Result: ${newReadingTime(text)}`)
