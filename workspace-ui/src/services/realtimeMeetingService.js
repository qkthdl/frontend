// 백엔드 막아둠

// export async function createMeetingSession(payload = {}) {
//   const sessionId = `session-${Date.now()}`
//   return {
//     id: sessionId,
//     sessionId,
//     roomName: payload.roomName || '개발 회의',
//     title: payload.title || '새 회의',
//     createdAt: new Date().toISOString(),
//   }
// }

// export async function getMeetingDetail(sessionId) {
//   return {
//     id: sessionId,
//     sessionId,
//     title: '실시간 회의 테스트',
//     meetingType: 'general',
//     meetingTime: '14:00',
//     keywords: 'STT, 회의 분석',
//   }
// }

// export async function getMeetingLibraryTree(sessionId) {
//   return {
//     items: [
//       {
//         id: 'file-1',
//         name: '회의자료.pdf',
//         previewLine: '업로드된 회의 자료입니다.',
//       },
//     ],
//   }
// }

// export async function getLiveTranscripts(sessionId) {
//   return {
//     items: [
//       {
//         id: 't1',
//         text: '회의를 시작합니다.',
//         previewLine: '회의를 시작합니다.',
//         createdAt: new Date().toISOString(),
//       },
//       {
//         id: 't2',
//         text: '현재 UI 통합 테스트 중입니다.',
//         previewLine: '현재 UI 통합 테스트 중입니다.',
//         createdAt: new Date().toISOString(),
//       },
//     ],
//   }
// }

// export async function getRealtimeTopic(sessionId) {
//   return {
//     topic: 'UI 통합 및 STT 테스트',
//   }
// }

// export async function getMeetingMidSummary(sessionId) {
//   return {
//     summary: '현재까지 UI 통합과 실시간 STT 흐름을 점검 중입니다.',
//   }
// }

// export async function getMeetingFeedback(sessionId) {
//   return {
//     feedback: '회의 흐름이 안정적이며, STT 데이터가 정상적으로 수집되고 있습니다.',
//   }
// }

// export async function uploadRealtimeChunk(sessionId, blob, offset) {
//   return {
//     transcript: '음성 데이터가 처리되었습니다.',
//   }
// }

// export async function uploadMeetingPlanFile(sessionId, file) {
//   return { ok: true }
// }

// export async function uploadKnowledgeFile(sessionId, file) {
//   return { ok: true }
// }

// export async function stopRealtimeMeeting(sessionId) {
//   return {
//     finalSummary: '회의가 정상적으로 종료되었습니다. 주요 논의 내용이 정리되었습니다.',
//   }
// }

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

async function parseJsonSafe(response) {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function request(url, options = {}, fallbackMessage = '요청에 실패했습니다.') {
  const response = await fetch(url, options)
  const data = await parseJsonSafe(response)

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || fallbackMessage)
  }

  return data
}

export async function createMeetingSession(payload) {
  return request(
    `${BASE_URL}/meeting/session/create`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    '회의 세션 생성에 실패했습니다.'
  )
}

export async function uploadMeetingPlanFile(sessionId, file) {
  const formData = new FormData()
  formData.append('file', file)

  return request(
    `${BASE_URL}/meeting/session/${sessionId}/plan`,
    {
      method: 'POST',
      body: formData,
    },
    '회의 계획서 업로드에 실패했습니다.'
  )
}

export async function uploadKnowledgeFile(sessionId, file) {
  const formData = new FormData()
  formData.append('file', file)

  return request(
    `${BASE_URL}/meeting/session/${sessionId}/knowledge`,
    {
      method: 'POST',
      body: formData,
    },
    '회의 자료 업로드에 실패했습니다.'
  )
}

export async function uploadGlobalKnowledgeFile(file) {
  const formData = new FormData()
  formData.append('file', file)

  return request(
    `${BASE_URL}/library/global/upload`,
    {
      method: 'POST',
      body: formData,
    },
    '공통 문서 업로드에 실패했습니다.'
  )
}

export async function uploadRealtimeChunk(sessionId, blob, offsetSec) {
  const formData = new FormData()
  formData.append('file', blob, `chunk_${Date.now()}.webm`)
  formData.append('offset_sec', String(offsetSec || 0))

  return request(
    `${BASE_URL}/meeting/session/${sessionId}/realtime-chunk`,
    {
      method: 'POST',
      body: formData,
    },
    '실시간 녹음 chunk 업로드에 실패했습니다.'
  )
}

export async function stopRealtimeMeeting(sessionId) {
  return request(
    `${BASE_URL}/meeting/session/${sessionId}/stop`,
    {
      method: 'POST',
    },
    '회의 종료 처리에 실패했습니다.'
  )
}

export async function getMeetingDetail(sessionId) {
  return request(
    `${BASE_URL}/meeting/session/${sessionId}`,
    {
      method: 'GET',
    },
    '회의 상세 정보를 불러오지 못했습니다.'
  )
}

export async function getMeetingLibraryTree(sessionId) {
  return request(
    `${BASE_URL}/meeting/session/${sessionId}/library-tree`,
    {
      method: 'GET',
    },
    '회의 자료함을 불러오지 못했습니다.'
  )
}

export async function getGlobalLibraryTree() {
  return request(
    `${BASE_URL}/library/global/tree`,
    {
      method: 'GET',
    },
    '자료함을 불러오지 못했습니다.'
  )
}

export async function getMeetingMidSummary(sessionId) {
  return request(
    `${BASE_URL}/meeting/session/${sessionId}/mid-summary`,
    {
      method: 'POST',
    },
    '회의 중간 요약 생성에 실패했습니다.'
  )
}

export async function getMeetingFeedback(sessionId) {
  return request(
    `${BASE_URL}/meeting/session/${sessionId}/feedback`,
    {
      method: 'POST',
    },
    '회의 피드백 생성에 실패했습니다.'
  )
}

export async function getRealtimeTopic(sessionId, seconds = 180) {
  if (!sessionId) {
    throw new Error('sessionId가 없어 실시간 주제 분석을 요청할 수 없습니다.')
  }

  const params = new URLSearchParams({
    session_id: sessionId,
    seconds: String(seconds),
  })

  return request(
    `${BASE_URL}/api/realtime-topic?${params.toString()}`,
    {
      method: 'GET',
    },
    '실시간 주제 분석에 실패했습니다.'
  )
}

export async function getLiveTranscripts(sessionId) {
  return request(
    `${BASE_URL}/meeting/session/${sessionId}/live-transcripts`,
    {
      method: 'GET',
    },
    '실시간 STT 기록을 불러오지 못했습니다.'
  )
}