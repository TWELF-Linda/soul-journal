// src/api/claude.js
// Calls Anthropic Claude API for AI journal questions and summaries

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

async function callClaude(systemPrompt, userMessage, apiKey) {
  const response = await fetch(CLAUDE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-calls': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })
  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error?.message || '呼叫 AI 失敗')
  }
  const data = await response.json()
  return data.content[0].text
}

// Generate 3 unique daily journal questions based on date + mood context
export async function generateDailyQuestions(date, apiKey) {
  const system = `你是一位溫柔、有洞察力的心靈日記引導師，擅長用充滿詩意卻不做作的方式提問。
你的問題應該：
1. 關注當下的小細節與感受，而非大道理
2. 語氣溫暖、口語化，像朋友在聊天
3. 鼓勵用戶反思情緒、人際關係、或當天經歷
4. 帶有一點生活感和趣味性
請回傳 JSON 格式，不要加 markdown backtick。`

  const user = `今天是 ${date}。請為今日日記生成 3 個不同主題的提問。
格式：{"questions": ["問題1", "問題2", "問題3"]}`

  const text = await callClaude(system, user, apiKey)
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean).questions
  } catch {
    return [
      '今天有沒有讓你感到「啊，這就是生活」的小瞬間？☀️',
      '今天與人的互動中，有沒有讓你感到溫暖或有點受傷的時刻？🌿',
      '如果今天的心情是一首歌，會是什麼感覺的曲子？🎵',
    ]
  }
}

// Generate a poetic daily diary summary from user's answers
export async function generateDiarySummary(questions, answers, mood, apiKey) {
  const system = `你是一位溫柔的日記作家，根據用戶的回答幫他們寫出今天的日記總結。
風格要求：
- 溫柔、詩意、但不過度煽情
- 用第二人稱「你」來寫
- 100-150字左右
- 結尾帶一個小小的鼓勵或觀察
- 加入用戶描述的具體細節，讓總結有個人感`

  const qa = questions.map((q, i) => `Q: ${q}\nA: ${answers[i] || '（未回答）'}`).join('\n\n')
  const user = `今天的心情：${mood}\n\n用戶的回答：\n${qa}\n\n請寫出今日日記總結：`

  return await callClaude(system, user, apiKey)
}

// Generate monthly summary from diary entries
export async function generateMonthlySummary(entries, apiKey) {
  const system = `你是一位心理諮商師兼日記分析師，幫用戶分析過去一個月的心靈日記。
分析重點：整體情緒走向、重要事件、娛樂品味、成長觀察
語氣：溫暖、真誠、有洞察力
長度：200字以內`

  const summary = entries.slice(0, 20).map(e =>
    `${e.date} 心情:${e.mood} 總結:${e.summary?.slice(0, 60) || '無'}`
  ).join('\n')

  const user = `以下是過去的日記摘要：\n${summary}\n\n請生成月度心靈報告：`
  return await callClaude(system, user, apiKey)
}
