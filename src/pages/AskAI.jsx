import { useEffect, useState } from 'react'

const API = 'https://restaurant-accountability-system.onrender.com'

const SUGGESTIONS = [
  'How much did I spend on food this month?',
  'What is my biggest expense?',
  'Any unusual transactions?',
  'How much did I spend on groceries?',
  'Top 5 spending categories',
  'How much did I spend on transport?'
]

export default function AskAI() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // load chat
  useEffect(() => {
    const saved = localStorage.getItem('chat')
    if (saved) setMessages(JSON.parse(saved))
  }, [])

  useEffect(() => {
    localStorage.setItem('chat', JSON.stringify(messages))
  }, [messages])

  async function sendMessage(q) {
    const question = q || input.trim()
    if (!question) return

    setMessages(prev => [...prev, { role: 'user', content: question }])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch(`${API}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      const data = await res.json()

      setMessages(prev => [
        ...prev,
        { role: 'ai', content: data.answer }
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'ai', content: '⚠️ API error' }
      ])
    }

    setLoading(false)
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'linear-gradient(135deg,#eef2ff,#f8fafc)'
    }}>

      {/* HEADER */}
      <div style={{ padding: 20 }}>
        <h2>Ask AI 🤖</h2>
        <p style={{ color: '#6b7280' }}>
          Ask questions about your spending
        </p>
      </div>

      {/* CHAT */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 12
      }}>

        {messages.length === 0 && (
          <div>
            {SUGGESTIONS.map((s, i) => (
              <div key={i}
                onClick={() => sendMessage(s)}
                style={{
                  padding: 10,
                  marginBottom: 8,
                  background: 'white',
                  borderRadius: 10,
                  cursor: 'pointer'
                }}>
                {s}
              </div>
            ))}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            background: m.role === 'user' ? '#111827' : 'white',
            color: m.role === 'user' ? 'white' : 'black',
            padding: 10,
            borderRadius: 10,
            maxWidth: '70%'
          }}>
            {m.content}
          </div>
        ))}

        {loading && <div>🤖 Thinking...</div>}
      </div>

      {/* INPUT */}
      <div style={{ display: 'flex', padding: 10 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          style={{ flex: 1, padding: 10 }}
        />
        <button onClick={() => sendMessage()}>
          Send
        </button>
      </div>
    </div>
  )
}