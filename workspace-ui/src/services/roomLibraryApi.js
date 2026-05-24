//백엔드 막음
// ===== FULL MOCK roomLibraryApi =====

// export async function getRoomLibraryTree(roomName) {
//   return {
//     counts: {
//       sessions: 2,
//       allItems: 5,
//       realtimeMeetings: 1,
//       postMeetingRecordings: 1,
//       uploadedKnowledge: 1,
//       analysisOutputs: 1,
//       todoOutputs: 1,
//     },

//     sessions: [
//       {
//         sessionId: 'session-1',
//         title: '테스트 회의',
//         status: 'done',
//         analysisCount: 1,
//         todoCount: 1,
//       },
//     ],

//     realtimeMeetings: [],
//     postMeetingRecordings: [],
//     uploadedKnowledge: [],
//     analysisOutputs: [],
//     todoOutputs: [],
//   }
// }

// export async function deleteLibraryItem(id) {
//   return { ok: true }
// }

// export async function deleteMeetingReportOutputs(sessionId) {
//   return { ok: true }
// }

// export async function uploadRoomKnowledgeFile(roomName, file) {
//   return { ok: true }
// }

// export async function previewLibraryItem(id) {
//   return {
//     name: '테스트 파일',
//     text: '미리보기 내용입니다.',
//     bucket: 'mock',
//     kind: 'text',
//   }
// }

// export function getLibraryItemDownloadUrl(id) {
//   return '#'
// }


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

export async function getRoomLibraryTree(roomName, channelId) {
  const room = roomName || 'default_room'
  const query = new URLSearchParams()
  query.set('room_name', room)
  if (channelId) query.set('channel_id', channelId)

  return request(
    `${API_BASE_URL}/library/room-tree?${query.toString()}`,
    {},
    '방별 자료함을 불러오지 못했습니다.',
  )
}

export async function getRoomSessions(roomName) {
  const room = roomName || 'default_room'

  return request(
    `${API_BASE_URL}/library/rooms/${encodeURIComponent(room)}/sessions`,
    {},
    '방별 회의 세션을 불러오지 못했습니다.',
  )
}

export async function uploadRoomKnowledgeFile(roomName, file, channelId) {
  const formData = new FormData()
  formData.append('file', file)
  if (channelId) formData.append('channel_id', channelId)

  return request(
    `${API_BASE_URL}/library/rooms/${encodeURIComponent(roomName || 'default_room')}/knowledge`,
    {
      method: 'POST',
      body: formData,
    },
    '방별 문서 업로드 실패',
  )
}

export async function previewLibraryItem(itemId) {
  return request(
    `${API_BASE_URL}/library/items/${encodeURIComponent(itemId)}/preview`,
    {},
    '자료 미리보기 실패',
  )
}

export function getLibraryItemDownloadUrl(itemId) {
  return `${API_BASE_URL}/library/items/${encodeURIComponent(itemId)}/download`
}

export async function deleteLibraryItem(itemId, deleteFile = true) {
  const query = new URLSearchParams()
  query.set('delete_file', deleteFile ? 'true' : 'false')

  return request(
    `${API_BASE_URL}/library/items/${encodeURIComponent(itemId)}?${query.toString()}`,
    {
      method: 'DELETE',
    },
    '자료 삭제 실패',
  )
}

export async function deleteMeetingReportOutputs(sessionId, deleteFiles = true) {
  const query = new URLSearchParams()
  query.set('delete_files', deleteFiles ? 'true' : 'false')

  return request(
    `${API_BASE_URL}/library/reports/${encodeURIComponent(sessionId)}?${query.toString()}`,
    {
      method: 'DELETE',
    },
    '회의 분석 결과 삭제 실패',
  )
}