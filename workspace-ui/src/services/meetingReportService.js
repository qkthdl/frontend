const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function request(url, options = {}, fallback = '요청 실패') {
  const res = await fetch(url, {
    credentials: 'include',
    ...options,
  })

  const data = await parseJsonSafe(res)

  if (!res.ok) {
    throw new Error(data?.detail || data?.message || fallback)
  }

  return data
}

function normalizeBool(value) {
  return value === true || value === '1' || value === 1 || value === 'true'
}

export async function uploadAudioForMeetingReport(file, options = {}) {
  if (!file) {
    throw new Error('업로드할 음성/영상 파일이 없습니다.')
  }

  const roomName = String(options.roomName || '').trim()

  if (!roomName || roomName === 'default_room') {
    throw new Error('룸을 먼저 선택한 뒤 STT 파일을 업로드하세요.')
  }

  const formData = new FormData()

  formData.append('file', file)
  formData.append('stt_model', options.sttModel || 'medium')
  formData.append('language', options.language || 'ko')
  formData.append('room_name', roomName)

  // 기본값 0: 업로드 request에서는 STT만 하고,
  // 분석 화면 진입 시 /meeting-report/{sessionId} 또는 regenerate에서 qwen/gemma 분석 생성
  formData.append('analyze_after', options.analyzeAfter ? '1' : '0')

  // pyannote/Hugging Face diarization 옵션. 기본 OFF.
  formData.append('diarization_enabled', normalizeBool(options.diarizationEnabled) ? '1' : '0')
  formData.append('speaker_count', options.speakerCount ? String(options.speakerCount) : '')

  return request(
    `${API_BASE_URL}/meeting-report/upload-audio`,
    {
      method: 'POST',
      body: formData,
    },
    '음성파일 업로드/STT 변환 실패',
  )
}

export async function getMeetingReport(sessionId) {
  if (!sessionId) throw new Error('sessionId가 없습니다.')
  // --- MOCK DATA ---
  return {
    totalSec: 1200,
    topicBlocks: [
      {
        id: "block_mock_1",
        startSec: 0,
        endSec: 600,
        topic: "1. 메인 To-Do 보드 개편",
        summary: "To-Do 보드를 기존의 단순 리스트 형태에서, 대기/진행 중/완료 상태를 시각적으로 보여주는 칸반 보드 형태로 개편하기로 결정했습니다. 또한 회의록 우측의 To-Do 사이드바는 역할을 분리하여 후속 과제 전용(Action Items)으로 가볍게 사용하기로 했습니다.",
        decisions: ["메인 To-Do 칸반 뷰 적용", "회의록 우측 탭 단순화"],
        tags: ["기획", "UI/UX"]
      },
      {
        id: "block_mock_2",
        startSec: 600,
        endSec: 1200,
        topic: "2. 향후 릴리스 및 테스트 일정",
        summary: "이번 주 내로 해당 작업을 마무리하고, 다음 주부터 통합 테스트를 진행할 예정입니다.",
        decisions: ["다음 주 QA 테스트 시작"],
        tags: ["일정"]
      }
    ],
    minutesMarkdown: "## 1. 개요\n이번 회의에서는 To-Do 기능 구조 개편을 논의했습니다.\n\n## 2. 주요 내용\n- 메인 To-Do 보드에 칸반(Kanban) 스타일 뷰 적용\n- 회의록 상세 페이지에서 불필요한 To-Do 관리 기능 덜어내기\n\n## 3. 다음 단계\n- 개발 및 QA 일정 협의",
    todoItems: [
      { id: "todo-mock-1", task: "칸반 보드 컴포넌트 프론트엔드 작업", assignee: "team", priority: "high", dueDate: "2026-06-01" },
      { id: "todo-mock-2", task: "QA 테스트 시나리오 초안 작성", assignee: "team", priority: "medium", dueDate: "2026-06-05" }
    ]
  }
}

export async function regenerateMeetingReport(sessionId) {
  if (!sessionId) throw new Error('sessionId가 없습니다.')
  return request(
    `${API_BASE_URL}/meeting-report/${encodeURIComponent(sessionId)}/regenerate`,
    {
      method: 'POST',
    },
    '회의 분석 재생성 실패',
  )
}

export async function getMeetingTranscript(sessionId) {
  if (!sessionId) throw new Error('sessionId가 없습니다.')
  // --- MOCK DATA ---
  return {
    transcript: [
      { id: 1, startSec: 10, endSec: 25, speaker: "Speaker 1", text: "여러분 안녕하세요, 오늘 회의 시작하겠습니다. To-Do 보드 관련해서 어떻게 바꿀지 얘기해보죠." },
      { id: 2, startSec: 26, endSec: 40, speaker: "Speaker 2", text: "저는 기존 리스트 형태보다 상태별로 볼 수 있는 칸반 보드가 훨씬 편할 것 같아요." },
      { id: 3, startSec: 41, endSec: 55, speaker: "Speaker 1", text: "네, 좋습니다. 그럼 메인 To-Do 화면을 칸반 뷰로 개편하는 걸로 결정하겠습니다." }
    ]
  }
}

export async function getMeetingReportItems(sessionId) {
  if (!sessionId) throw new Error('sessionId가 없습니다.')
  return request(
    `${API_BASE_URL}/meeting-report/${encodeURIComponent(sessionId)}/items`,
    {},
    '회의 자료 목록을 불러오지 못했습니다.',
  )
}

export async function logMeetingAIEvent({
  sessionId,
  question,
  answer,
  askedAtSec,
  beforeContext = '',
  afterContext = '',
}) {
  if (!sessionId || !question) return null

  return request(
    `${API_BASE_URL}/meeting-report/${encodeURIComponent(sessionId)}/ai-event`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        answer: answer || '',
        askedAtSec: Number(askedAtSec || 0),
        beforeContext,
        afterContext,
      }),
    },
    'AI 사용 기록 저장 실패',
  )
}


export async function generateTemplateMeetingReport({
  templateFile,
  sessionId,
  roomName = '',
  outputFormat = 'hwpx',
  userPrompt = '',
}) {
  if (!templateFile) throw new Error('회의록 양식 파일을 선택하세요.')
  if (!sessionId) throw new Error('sessionId가 없습니다.')

  // --- MOCK DATA: Simulate network request and download ---
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockContent = `Mock 회의록 자동 작성 결과\n\nSession ID: ${sessionId}\n작성 지시: ${userPrompt}\n선택한 템플릿: ${templateFile.name}`
      const blob = new Blob([mockContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
      const filename = `mock-meeting-report-${sessionId}.docx`

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      resolve({ ok: true, filename })
    }, 1500)
  })
}
