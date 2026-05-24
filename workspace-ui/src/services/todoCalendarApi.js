//백엔드 막아둠

// export async function getRoomTodos(roomName, filters = {}) {
//   return {
//     todos: [
//       {
//         id: 'todo-1',
//         title: 'UI 통합 마무리',
//         description: 'KimTodoBoard를 회의록 옆 탭에 연결합니다.',
//         status: 'open',
//         priority: 'high',
//         weekLabel: '1주차',
//         sessionId: 'session-1',
//         sessionTitle: '개발 회의',
//         assigneeType: 'team',
//         assigneeName: 'Dev User',
//         recommendedDueDate: '2026-05-05',
//         dueDate: '',
//         calendarScope: 'team',
//       },
//     ],
//     sessions: [
//       { id: 'session-1', title: '개발 회의' },
//     ],
//     weekLabels: ['1주차', '2주차'],
//   }
// }

// export async function getSessionTodos(sessionId) {
//   return {
//     todos: [],
//   }
// }

// export async function updateTodo(todoId, payload) {
//   return { ok: true, id: todoId, ...payload }
// }

// export async function deleteTodo(todoId) {
//   return { ok: true, id: todoId }
// }

// export async function addTodoToCalendar(todoId, payload) {
//   return { ok: true, id: todoId, ...payload }
// }

// export async function getCalendarEvents(filters = {}) {
//   return { events: [] }
// }

// export async function createCalendarEvent(payload) {
//   return { ok: true, id: `event-${Date.now()}`, ...payload }
// }

// export async function deleteCalendarEvent(eventId) {
//   return { ok: true, id: eventId }
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

export async function getRoomTodos(roomName, filters = {}) {
  const query = new URLSearchParams()
  query.set('status', filters.status || 'all')
  query.set('week_label', filters.weekLabel || 'all')
  query.set('session_id', filters.sessionId || 'all')
  if (filters.channelId) query.set('channel_id', filters.channelId)

  return request(
    `${API_BASE_URL}/todo-calendar/todo/room/${encodeURIComponent(roomName)}?${query.toString()}`,
    {},
    'To-Do 목록을 불러오지 못했습니다.',
  )
}

export async function getSessionTodos(sessionId) {
  return request(
    `${API_BASE_URL}/todo-calendar/todo/session/${encodeURIComponent(sessionId)}`,
    {},
    '회의별 To-Do 목록을 불러오지 못했습니다.',
  )
}

export async function updateTodo(todoId, payload) {
  return request(
    `${API_BASE_URL}/todo-calendar/todo/${encodeURIComponent(todoId)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    'To-Do 수정 실패',
  )
}

export async function createTodo(payload) {
  return request(
    `${API_BASE_URL}/todo-calendar/todo`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    'To-Do 생성 실패',
  )
}

export async function deleteTodo(todoId) {
  return request(
    `${API_BASE_URL}/todo-calendar/todo/${encodeURIComponent(todoId)}`,
    {
      method: 'DELETE',
    },
    'To-Do 삭제 실패',
  )
}

export async function addTodoToCalendar(todoId, payload) {
  return request(
    `${API_BASE_URL}/todo-calendar/todo/${encodeURIComponent(todoId)}/calendar`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    '캘린더 추가 실패',
  )
}

export async function getCalendarEvents(filters = {}) {
  const query = new URLSearchParams()

  if (filters.roomName) query.set('room_name', filters.roomName)
  if (filters.channelId) query.set('channel_id', filters.channelId)
  query.set('scope', filters.scope || 'personal')
  query.set('week_label', filters.weekLabel || 'all')

  if (filters.dateFrom) query.set('date_from', filters.dateFrom)
  if (filters.dateTo) query.set('date_to', filters.dateTo)

  return request(
    `${API_BASE_URL}/todo-calendar/calendar/events?${query.toString()}`,
    {},
    '캘린더 일정을 불러오지 못했습니다.',
  )
}

export async function createCalendarEvent(payload) {
  return request(
    `${API_BASE_URL}/todo-calendar/calendar/events`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    },
    '캘린더 일정 생성 실패',
  )
}

export async function deleteCalendarEvent(eventId) {
  return request(
    `${API_BASE_URL}/todo-calendar/calendar/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
    },
    '캘린더 일정 삭제 실패',
  )
}
