import { useEffect, useRef, useState } from 'react'
import { MessageCircle, X, Send, Sparkles, WifiOff } from 'lucide-react'
import { isOnline, subscribeNetworkStatus } from '../services/networkStatus'

const INITIAL_MESSAGES = [
  {
    id: 'm1',
    role: 'assistant',
    text: "Hi Vishal, I'm your AI Career Mentor. Ask me about closing your skill gaps, tailoring your resume, or prepping for an interview.",
  },
]

// Drop your DeepSeek (or any LLM) API call in here. This function currently
// simulates a response so the UI is fully wireable without a backend.
async function fetchAssistantReply(conversation) {
  await new Promise((resolve) => setTimeout(resolve, 700))
  return "That's a great question — once this widget is wired to the DeepSeek API, I'll give you a tailored answer based on your skill profile."
}

export default function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [draft, setDraft] = useState('')
  const [isThinking, setIsThinking] = useState(false)
  const [isOffline, setIsOffline] = useState(!isOnline())
  const scrollRef = useRef(null)

  useEffect(() => {
    const unsub = subscribeNetworkStatus((online) => {
      setIsOffline(!online)
    })
    return unsub
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isOpen, isThinking])

  async function handleSend(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || isThinking) return

    if (!isOnline()) {
      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: 'user', text },
        { id: `off-${Date.now()}`, role: 'assistant', text: 'I am currently offline. An active internet connection is required to talk with your AI Career Mentor.' },
      ])
      setDraft('')
      return
    }

    const nextMessages = [...messages, { id: `u-${Date.now()}`, role: 'user', text }]
    setMessages(nextMessages)
    setDraft('')
    setIsThinking(true)

    try {
      const reply = await fetchAssistantReply(nextMessages)
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', text: reply }])
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, role: 'assistant', text: "I couldn't reach the mentor service. Please try again." },
      ])
    } finally {
      setIsThinking(false)
    }
  }

  return (
    <>
      {isOpen && (
        <div className="fixed inset-x-4 bottom-24 z-50 flex h-[70vh] max-h-[520px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md sm:inset-x-auto sm:right-6 sm:w-[360px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-900 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/15">
                <Sparkles size={15} className="text-teal-400" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium text-white">AI Career Mentor</p>
                <p className="text-[11px] text-slate-400">Usually replies instantly</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Offline Notice Banner */}
          {isOffline && (
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-800">
              <WifiOff size={13} className="text-amber-600 shrink-0" />
              <span>Offline · AI Career Mentor requires an active connection.</span>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={[
                    'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed shadow-card',
                    message.role === 'user'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-700',
                  ].join(' ')}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-xl bg-white px-3.5 py-2.5 shadow-card">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300" />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-slate-100 p-3">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about interviews, resumes, skills…"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-400"
            />
            <button
              type="submit"
              disabled={!draft.trim() || isThinking}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Close AI Career Mentor' : 'Open AI Career Mentor'}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition-colors hover:bg-indigo-500"
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  )
}
