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

// --- MOCK DATA STATE ---
let mockTodos = [
  {
    id: 'todo-mock-1',
    title: 'UI 기획서 리뷰 및 피드백 반영',
    description: '디자인 팀에서 전달한 기획서 리뷰 진행',
    status: 'open',
    priority: 'high',
    weekLabel: '1주차',
    sessionId: 'session-mock-1',
    sessionTitle: '주간 업무 회의',
    assigneeType: 'team',
    assigneeName: '-',
    recommendedDueDate: '2026-06-01',
    dueDate: '2026-06-02',
    calendarScope: 'team'
  },
  {
    id: 'todo-mock-2',
    title: '칸반 보드 컴포넌트 개발',
    description: 'TodoBoard.jsx 프론트엔드 작업',
    status: 'in_progress',
    priority: 'high',
    weekLabel: '2주차',
    sessionId: 'session-mock-1',
    sessionTitle: '주간 업무 회의',
    assigneeType: 'personal',
    assigneeName: 'Frontend Dev',
    recommendedDueDate: '2026-06-05',
    dueDate: '2026-06-06',
    calendarScope: 'personal'
  },
  {
    id: 'todo-mock-3',
    title: '테스트 코드 작성',
    description: 'Jest를 활용한 유닛 테스트 추가',
    status: 'open',
    priority: 'medium',
    weekLabel: '3주차',
    sessionId: 'session-mock-2',
    sessionTitle: '스프린트 백로그 리뷰',
    assigneeType: 'team',
    assigneeName: '-',
    recommendedDueDate: '2026-06-10',
    dueDate: '',
    calendarScope: 'team'
  },
  {
    id: 'todo-mock-4',
    title: 'API 연동 테스트',
    description: '백엔드 API 연동 및 데이터 표시 확인',
    status: 'done',
    priority: 'high',
    weekLabel: '2주차',
    sessionId: 'session-mock-2',
    sessionTitle: '스프린트 백로그 리뷰',
    assigneeType: 'team',
    assigneeName: '-',
    recommendedDueDate: '2026-06-08',
    dueDate: '2026-06-08',
    calendarScope: 'team'
  }
];

export async function getRoomTodos(roomName, filters = {}) {
  let filtered = mockTodos;
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(t => t.status === filters.status);
  }
  if (filters.weekLabel && filters.weekLabel !== 'all') {
    filtered = filtered.filter(t => t.weekLabel === filters.weekLabel);
  }
  if (filters.sessionId && filters.sessionId !== 'all') {
    filtered = filtered.filter(t => t.sessionId === filters.sessionId);
  }

  return {
    todos: filtered,
    sessions: [
      { id: 'session-mock-1', title: '주간 업무 회의' },
      { id: 'session-mock-2', title: '스프린트 백로그 리뷰' }
    ],
    weekLabels: ['1주차', '2주차', '3주차']
  };
}

export async function getSessionTodos(sessionId) {
  return {
    todos: mockTodos.filter(t => t.sessionId === sessionId),
  };
}

export async function updateTodo(todoId, payload) {
  mockTodos = mockTodos.map(t => t.id === todoId ? { ...t, ...payload } : t);
  return { ok: true, id: todoId, ...payload };
}

export async function createTodo(payload) {
  const newTodo = {
    id: `todo-mock-${Date.now()}`,
    ...payload,
    status: payload.status || 'open',
  };
  mockTodos.push(newTodo);
  return { ok: true, ...newTodo };
}

export async function deleteTodo(todoId) {
  mockTodos = mockTodos.filter(t => t.id !== todoId);
  return { ok: true, id: todoId };
}

export async function addTodoToCalendar(todoId, payload) {
  // --- MOCK DATA ---
  return { ok: true, id: todoId, ...payload };
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
