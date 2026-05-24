export async function fetchLibraryItems(roomName) {
  // --- MOCK DATA ---
  // 실제 백엔드는 /api/room/${roomName}/library 에 GET 요청을 보냄
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        ok: true,
        items: [
          {
            id: 'lib-mock-1',
            kind: 'PDF',
            name: '신제품 UI 리뷰 자료.pdf',
            created_at: '2026-05-01T10:00:00Z',
            created_by: '김서연',
            size: '2.4MB' // mock용. 실제로는 파일 사이즈나 bucket/file_path 등이 옴
          },
          {
            id: 'lib-mock-2',
            kind: 'TXT',
            name: '디자인 시스템 논의_STT.txt',
            created_at: '2026-04-30T14:30:00Z',
            created_by: '박준호',
            size: '1.1MB'
          },
          {
            id: 'lib-mock-3',
            kind: 'PPT',
            name: '프로젝트A 킥오프 발표.pptx',
            created_at: '2026-04-28T09:15:00Z',
            created_by: '이하은',
            size: '5.3MB'
          },
          {
            id: 'lib-mock-4',
            kind: 'IMG',
            name: '아이콘 레퍼런스.png',
            created_at: '2026-04-25T16:20:00Z',
            created_by: '최지우',
            size: '3.2MB'
          }
        ]
      })
    }, 500)
  })
}
