/**
 * VoiceCommandManager — optional, uses the browser Web Speech API when
 * available. No external AI service required. Parses a small command grammar
 * and dispatches actions. Fails gracefully if speech recognition is missing.
 *
 * You can also feed commands manually via handle('show my calendar') for
 * testing without a microphone.
 */
const GRAMMAR = [
  { re: /show (my )?calendar/, action: { type: 'showCard', id: 'calendar' } },
  { re: /show (my )?tasks/, action: { type: 'showCard', id: 'tasks' } },
  { re: /hide notifications/, action: { type: 'hideCard', id: 'notifications' } },
  { re: /show (system|status)/, action: { type: 'showCard', id: 'system' } },
  { re: /show github/, action: { type: 'showCard', id: 'github' } },
  { re: /show weather/, action: { type: 'showCard', id: 'weather' } },
  { re: /start focus/, action: { type: 'focus', op: 'start' } },
  { re: /pause focus/, action: { type: 'focus', op: 'pause' } },
  { re: /reset workspace/, action: { type: 'resetWorkspace' } },
]

export class VoiceCommandManager {
  constructor(onAction) {
    this.onAction = onAction
    this.recognition = null
    this.listening = false
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      this.recognition = new SR()
      this.recognition.continuous = true
      this.recognition.interimResults = false
      this.recognition.lang = 'en-US'
      this.recognition.onresult = (e) => {
        const last = e.results[e.results.length - 1]
        if (last && last[0]) this.handle(last[0].transcript.toLowerCase())
      }
      this.recognition.onerror = () => {}
    }
  }

  get available() {
    return !!this.recognition
  }

  start() {
    if (this.recognition && !this.listening) {
      try {
        this.recognition.start()
        this.listening = true
      } catch {
        /* already started */
      }
    }
  }

  stop() {
    if (this.recognition && this.listening) {
      this.recognition.stop()
      this.listening = false
    }
  }

  // Parse and dispatch a text command. Returns the matched action or null.
  handle(text) {
    for (const g of GRAMMAR) {
      if (g.re.test(text)) {
        this.onAction?.(g.action)
        return g.action
      }
    }
    return null
  }
}
