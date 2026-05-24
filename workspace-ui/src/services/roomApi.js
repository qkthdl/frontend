//백엔드 막아둠
// 백엔드 임시 차단용 mock roomApi.js

// export const API_BASE = ''

// export async function fetchRooms() {
//   return {
//     rooms: [
//       {
//         id: 'room-1',
//         roomName: '개발 회의',
//         name: '개발 회의',
//         color: '#3b82f6',
//         role: 'owner',
//         createdAt: '2026-01-01',
//       },
//       {
//         id: 'room-2',
//         roomName: '캡스톤 회의',
//         name: '캡스톤 회의',
//         color: '#10b981',
//         role: 'member',
//         createdAt: '2026-01-02',
//       },
//     ],
//   }
// }

// export async function createRoom(roomName, color = '#7c3aed', visibility = 'public') {
//   return {
//     id: `room-${Date.now()}`,
//     roomName,
//     name: roomName,
//     color,
//     visibility,
//     role: 'owner',
//     createdAt: new Date().toISOString(),
//   }
// }

// export async function fetchRoomSessions(roomName) {
//   return {
//     sessions: [],
//   }
// }

// export async function fetchAllCalendarEvents() {
//   return {
//     events: [
//       {
//         id: 'event-all-1',
//         title: '전체 일정 예시',
//         date: '2026-05-04',
//         startTime: '2026-05-04T14:00:00',
//         endTime: '2026-05-04T15:00:00',
//         roomName: '개발 회의',
//         channel: '개발 회의',
//         isPrivate: false,
//         color: '#3b82f6',
//       },
//     ],
//   }
// }

// export async function fetchCalendarEvents(roomName) {
//   return {
//     events: [
//       {
//         id: `event-${roomName}-1`,
//         title: `${roomName} 일정 예시`,
//         date: '2026-05-04',
//         startTime: '2026-05-04T14:00:00',
//         endTime: '2026-05-04T15:00:00',
//         roomName,
//         channel: roomName,
//         isPrivate: false,
//         color: '#3b82f6',
//       },
//     ],
//   }
// }

// export async function fetchRoomCalendar(roomName) {
//   return fetchCalendarEvents(roomName)
// }

// export async function createRoomCalendarEvent(roomName, event) {
//   return {
//     id: `event-${Date.now()}`,
//     roomName,
//     channel: roomName,
//     title: event.title,
//     date: event.startTime ? event.startTime.split('T')[0] : event.date,
//     startTime: event.startTime,
//     endTime: event.endTime,
//     description: event.description || '',
//     isPrivate: event.isPrivate || false,
//     color: '#3b82f6',
//   }
// }

// export async function fetchRoomMembers(roomName) {
//   return {
//     members: [
//       {
//         userId: 'user-1',
//         name: 'Dev User',
//         email: 'dev@test.com',
//         role: 'owner',
//       },
//     ],
//   }
// }

// export async function createInviteLink(roomName) {
//   return {
//     inviteUrl: `http://localhost:5173/invite/TEST123?room=${encodeURIComponent(roomName)}`,
//   }
// }

// export async function fetchInviteInfo(inviteCode) {
//   return {
//     roomName: '테스트 회의실',
//     inviter: 'Dev User',
//   }
// }

// export async function acceptInvite(inviteCode) {
//   return { ok: true }
// }

// export async function createRoomInvite(roomName) {
//   return { ok: true }
// }

// export async function deleteRoomCalendarEvent(roomName, eventId) {
//   return { ok: true, roomName, eventId }
// }

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

async function parseResponse(res) {
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const message = data?.detail || data?.message || '요청 처리 중 오류가 발생했습니다.'
    throw new Error(message)
  }

  return data
}

export async function fetchRooms() {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: 'GET',
    credentials: 'include',
  })

  return parseResponse(res)
}

export async function createRoom(roomName) {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ roomName }),
  })

  return parseResponse(res)
}

export async function fetchRoomSessions(roomName, channelId = null) {
  let url = `${API_BASE}/rooms/${encodeURIComponent(roomName)}/sessions`
  if (channelId) {
    url += `?channel_id=${encodeURIComponent(channelId)}`
  }
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  return parseResponse(res)
}

export async function fetchRoomMembers(roomName) {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomName)}/members`, {
    method: 'GET',
    credentials: 'include',
  })

  return parseResponse(res)
}

export async function createInviteLink(roomName) {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomName)}/invite-link`, {
    method: 'POST',
    credentials: 'include',
  })

  return parseResponse(res)
}

export async function fetchInviteInfo(inviteCode) {
  const res = await fetch(`${API_BASE}/rooms/invite/${encodeURIComponent(inviteCode)}`, {
    method: 'GET',
    credentials: 'include',
  })

  return parseResponse(res)
}

export async function acceptInvite(inviteCode) {
  const res = await fetch(`${API_BASE}/rooms/invite/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ inviteCode }),
  })

  return parseResponse(res)
}
export async function fetchCalendarEvents(roomName, channelId = null) {
  let url = `${API_BASE}/rooms/${encodeURIComponent(roomName)}/calendar/events`
  if (channelId) {
    url += `?channel_id=${encodeURIComponent(channelId)}`
  }
  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  })

  return parseResponse(res)
}

export async function createCalendarEvent(roomName, channelId, eventData) {
  let url = `${API_BASE}/rooms/${encodeURIComponent(roomName)}/calendar/events`
  if (channelId) {
    url += `?channel_id=${encodeURIComponent(channelId)}`
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(eventData),
  })

  return parseResponse(res)
}

export async function deleteCalendarEvent(roomName, eventId) {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomName)}/calendar/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  return parseResponse(res)
}

export async function fetchChannels(roomName) {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomName)}/channels`, {
    method: 'GET',
    credentials: 'include',
  })
  return parseResponse(res)
}

export async function createChannel(roomName, channelName, description = '', color = '') {
  const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomName)}/channels`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ channelName, description, color }),
  })
  return parseResponse(res)
}

export { API_BASE }
