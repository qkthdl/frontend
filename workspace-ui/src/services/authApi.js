

export async function fetchMe() {
  return {
    authenticated: true,
    user: {
      id: 'dev-user',
      name: 'Dev User',
      email: 'dev@example.com',
      picture: null,
    },
  }
}

export function loginWithGoogle() {
  console.log('UI 개발 중: Google login 비활성화')
}

export async function logout() {
  return { ok: true }
}

//백엔드 막아두고 할때
// const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

// async function parseResponse(res) {
//   const data = await res.json().catch(() => null)

//   if (!res.ok) {
//     const message = data?.detail || data?.message || '요청 처리 중 오류가 발생했습니다.'
//     throw new Error(message)
//   }

//   return data
// }

// export async function fetchMe() {
//   const res = await fetch(`${API_BASE}/auth/me`, {
//     method: 'GET',
//     credentials: 'include',
//   })

//   return parseResponse(res)
// }

// export function loginWithGoogle() {
//   window.location.href = `${API_BASE}/auth/google/login`
// }

// export async function logout() {
//   const res = await fetch(`${API_BASE}/auth/logout`, {
//     method: 'POST',
//     credentials: 'include',
//   })

//   return parseResponse(res)
// }
