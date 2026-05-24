import React, { useEffect, useMemo, useState } from 'react'
import { Bot, Clock, FileText, Loader2, Network, RefreshCw, Sparkles, CheckSquare, Square, Calendar, User, Edit2, ChevronDown, Plus, CheckCircle2, Check, Users, ArrowRight, ChevronLeft, MoreHorizontal } from 'lucide-react'
import { getSessionTodos, createTodo, updateTodo } from '../services/todoCalendarApi'
import { getMeetingReport, regenerateMeetingReport, getMeetingTranscript } from '../services/meetingReportService'
import { fetchRoomSessions } from '../services/roomApi'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const groupSessionsByDate = (sessionsList) => {
  const groups = {}
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  sessionsList.forEach(s => {
    const d = new Date(s.createdAt)
    let label = d.toLocaleDateString('ko-KR')
    
    if (d.toDateString() === today.toDateString()) {
      label = '오늘'
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = '어제'
    } else {
      const days = ['일', '월', '화', '수', '목', '금', '토']
      label = `${d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.$/, '')} (${days[d.getDay()]})`
    }

    if (!groups[label]) groups[label] = []
    groups[label].push(s)
  })
  return groups
}

function formatSec(sec = 0) {
  sec = Math.max(0, Math.floor(sec))
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const colors = ['bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-cyan-500']

const PriorityBadge = ({ level }) => {
  if (level === 'high') return <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100"><CheckCircle2 className="w-3 h-3"/> 높음</span>
  if (level === 'medium') return <span className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100"><CheckCircle2 className="w-3 h-3"/> 중간</span>
  return <span className="flex items-center gap-1 text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100"><CheckCircle2 className="w-3 h-3"/> 낮음</span>
}

export default function MeetingReportView({ roomName, channelId, sessionId }) {
  const [activeSessionId, setActiveSessionId] = useState(sessionId || null)
  const [sessions, setSessions] = useState([])
  const [isSessionsLoading, setIsSessionsLoading] = useState(false)

  const [report, setReport] = useState(null)
  const [transcript, setTranscript] = useState(null)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [hoverBlockId, setHoverBlockId] = useState(null)
  const [selectedAiEvent, setSelectedAiEvent] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [errorText, setErrorText] = useState('')
  const [activeTab, setActiveTab] = useState('summary')
  const [isSttOpen, setIsSttOpen] = useState(false)
  const [todoTab, setTodoTab] = useState('ai')
  const [isAddingTodo, setIsAddingTodo] = useState(false)
  
  const [aiTodos, setAiTodos] = useState([])
  const [registeredTodos, setRegisteredTodos] = useState([])
  const [newTodo, setNewTodo] = useState({ title: '', dueDate: '', priority: 'medium' })

  const loadTodos = async () => {
    if (!activeSessionId) return
    try {
      const data = await getSessionTodos(activeSessionId)
      const dbTodos = data?.todos || []
      
      let suggested = dbTodos.filter(t => t.status === 'suggested').map(t => ({ ...t, selected: true }))
      const registered = dbTodos.filter(t => t.status !== 'suggested')
      
      if (suggested.length === 0 && report?.todoItems && report.todoItems.length > 0) {
        suggested = report.todoItems.map(t => ({ ...t, status: 'suggested', selected: true }))
      }
      
      if (suggested.length === 0 && report?.minutesMarkdown) {
        const todoMatch = report.minutesMarkdown.match(/## 2\. To-Do([\s\S]*?)(?=## 3\. AI 사용 시점|$)/)
        if (todoMatch && todoMatch[1]) {
          const lines = todoMatch[1].split('\n').filter(l => l.trim().startsWith('-'))
          suggested = lines.map((line, idx) => ({
            id: `extracted-${idx}`,
            title: line.replace(/^- /, '').replace(/\[.*?\]/, '').trim(),
            assignee: 'team',
            priority: 'medium',
            date: line.match(/\[(.*?)\]/) ? line.match(/\[(.*?)\]/)[1] : '-',
            status: 'suggested',
            selected: true
          }))
        }
      }

      setAiTodos(suggested)
      setRegisteredTodos(registered)
    } catch (e) {
      console.error('Failed to load todos:', e)
    }
  }

  useEffect(() => {
    if (activeSessionId && report) {
      loadTodos()
    }
  }, [activeSessionId, report])

  const toggleAiTodo = (id) => {
    setAiTodos(prev => prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t))
  }

  const handleAddTodo = async () => {
    if (!newTodo.title.trim()) return
    try {
      await createTodo({
        roomName: roomName || 'default_room',
        channelId: channelId,
        sessionId: activeSessionId,
        title: newTodo.title,
        dueDate: newTodo.dueDate,
        priority: newTodo.priority,
        assigneeType: 'team',
      })
      setIsAddingTodo(false)
      setTodoTab('registered')
      setNewTodo({ title: '', dueDate: '', priority: 'medium' })
      loadTodos()
    } catch (e) {
      alert(e.message)
    }
  }

  const handleRegisterSelectedAiTodos = async () => {
    const selected = aiTodos.filter(t => t.selected)
    if (!selected.length) return
    
    try {
      await Promise.all(selected.map(t => 
        updateTodo(t.id, { status: 'open' })
      ))
      setTodoTab('registered')
      loadTodos()
    } catch (e) {
      alert('등록 중 오류가 발생했습니다: ' + e.message)
    }
  }

  useEffect(() => {
    if (sessionId) setActiveSessionId(sessionId)
  }, [sessionId])

  const totalSec = Math.max(1, report?.totalSec || 1)

  const activeBlock = useMemo(() => {
    if (!report?.topicBlocks?.length) return null
    return report.topicBlocks.find((b) => b.id === hoverBlockId) || selectedBlock || report.topicBlocks[0]
  }, [report, hoverBlockId, selectedBlock])

  const loadSessions = async () => {
    if (!roomName) return
    setIsSessionsLoading(true)
    try {
      const data = await fetchRoomSessions(roomName, channelId)
      if (data?.sessions) {
        setSessions(data.sessions)
      }
    } catch (e) {
      setErrorText('회의 목록을 불러오지 못했습니다: ' + e.message)
    } finally {
      setIsSessionsLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [roomName, channelId])

  const loadReport = async () => {
    if (!activeSessionId) return

    setIsLoading(true)
    setErrorText('')

    try {
      const data = await getMeetingReport(activeSessionId)
      if (!data || !data.meetingSummary) throw new Error('No data');
      setReport(data)
      setSelectedBlock(data.topicBlocks?.[0] || null)

      try {
        const t = await getMeetingTranscript(activeSessionId)
        setTranscript(t)
      } catch {
        setTranscript(null)
      }
    } catch (e) {
      console.warn('Using mock meeting report because server is unreachable or empty:', e)
      const mockReport = {
        meetingSummary: {
          summary: "- 디자인 시스템 Button 컴포넌트의 상태별 스타일을 정리하고 가이드 문서에 반영하기로 결정했습니다.\n- Input 컴포넌트의 에러 처리 방식과 접근성 개선 사항을 논의했습니다.\n- 컴포넌트 스토리북 정비 및 테스트 케이스 보강을 다음 스프린트에서 진행하기로 했습니다."
        },
        topicBlocks: [
          {
            id: 'mock-topic-1',
            title: 'LLM 앱과 서버 지원',
            startTime: '00:11',
            endTime: '02:33',
            summary: '회의에서는 LLM API를 사용할 때의 문제와 AWS, 클로바 등의 관련성을 다루었다. 특히 AWS와 클로바의 API 주제가 떠올랐다.',
            keywords: ['LLM API', '서버 지원', '클로바']
          }
        ]
      };
      setReport(mockReport)
      setSelectedBlock(mockReport.topicBlocks[0])
      setTranscript({
        lines: [
          { id: '1', speaker: '익명1', text: '저희가 LLM API를...', timestamp: '00:11' },
          { id: '2', speaker: '익명1', text: 'LLM을 온 디바이스로 못하...', timestamp: '00:14' }
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!activeSessionId) return
    setIsRegenerating(true)
    setErrorText('')

    try {
      const data = await regenerateMeetingReport(activeSessionId)
      setReport(data)
      setSelectedBlock(data.topicBlocks?.[0] || null)
    } catch (e) {
      setErrorText(e.message)
    } finally {
      setIsRegenerating(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [activeSessionId])

  return (
    <div className="flex-1 h-full overflow-hidden bg-[#f7f8fb] flex">
      {!activeSessionId ? (
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="max-w-[1200px] mx-auto">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-[24px] font-black text-gray-900">회의록 보관함</h1>
                <p className="text-[14px] text-gray-500 font-medium mt-1">지금까지 진행된 모든 회의의 요약과 분석을 확인하세요.</p>
              </div>
            </div>
            
            {isSessionsLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <FileText className="w-16 h-16 text-gray-200 mx-auto mb-5" />
                <div className="text-xl font-bold text-gray-900 mb-2">기록된 회의가 없습니다</div>
                <p className="text-[15px] text-gray-500">새로운 회의를 진행하고 AI 요약 리포트를 받아보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-20">
                {sessions.map(s => {
                  const d = new Date(s.createdAt);
                  const days = ['일', '월', '화', '수', '목', '금', '토'];
                  const dateStr = `${d.toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\.$/, '')} (${days[d.getDay()]})`;
                  const timeStr = d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div 
                      key={s.id}
                      onClick={() => setActiveSessionId(s.id)}
                      className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-violet-200 hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-[160px]"
                    >
                      <div className="flex items-start gap-4 mb-auto">
                        <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-600 transition-colors">
                          <FileText className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="font-bold text-[16px] text-gray-900 truncate mb-1 group-hover:text-violet-600 transition-colors">{s.title || '제목 없는 회의'}</div>
                          <div className="text-[12px] text-gray-500 font-bold">
                            {dateStr} {timeStr}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-50 text-[13px] font-bold text-gray-400">
                        <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /> 2명</div>
                        {s.analysisCount > 0 ? (
                          <div className="flex items-center gap-1.5 text-emerald-500"><Sparkles className="w-4 h-4" /> 분석 완료</div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-gray-300"><Clock className="w-4 h-4" /> 대기 중</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Left Sidebar */}
          <aside className="w-[340px] border-r border-gray-200 bg-[#fbfbfa] flex flex-col shrink-0 h-full">
            <div className="p-6 pb-2 shrink-0">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-600" />
                회의록
              </h2>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                  <input type="text" placeholder="회의 제목, 키워드 검색" className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500" />
                </div>
                <button className="flex items-center gap-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  필터
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-2 custom-scrollbar space-y-6">
              {isSessionsLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-10">회의가 없습니다.</div>
              ) : (
                Object.entries(groupSessionsByDate(sessions)).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    <h3 className="text-xs font-bold text-violet-600 mb-2 px-2">{dateLabel}</h3>
                    <div className="space-y-1.5">
                      {items.map(s => {
                        const isActive = s.id === activeSessionId
                        return (
                          <button
                            key={s.id}
                            onClick={() => setActiveSessionId(s.id)}
                            className={`w-full text-left p-4 rounded-2xl border transition-all ${isActive ? 'bg-violet-50 border-violet-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-violet-600 text-white' : 'bg-violet-100 text-violet-600'}`}>
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm text-gray-900 truncate mb-1">{s.title || '제목 없는 회의'}</div>
                                <div className="text-xs text-gray-500 flex items-center justify-between">
                                  <span>{new Date(s.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span>
                                  <div className="flex items-center">
                                    <User className="w-3.5 h-3.5 text-gray-400 mr-0.5" />
                                    <span>2명</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

      {/* Right Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-[#f7f8fb]">
        {activeSessionId && report ? (
          <header className="bg-white border-b border-gray-200 px-8 pt-6 flex flex-col shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <button 
                  onClick={() => setActiveSessionId(null)}
                  className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> 회의 목록으로 돌아가기
                </button>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h1 className="text-2xl font-black text-gray-900">{report?.session?.title || '회의'}</h1>
                  <button className="text-gray-400 hover:text-gray-600"><Edit2 className="w-4 h-4" /></button>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 ml-13 mb-6">
                  <span className="flex items-center gap-1.5 font-medium"><Calendar className="w-3.5 h-3.5" /> 2024.04.18 (금) 19:51 - 20:11</span>
                  <span className="flex items-center gap-1.5 font-medium"><Users className="w-3.5 h-3.5" /> 참석자 4명</span>
                  <span className="flex items-center gap-1.5 font-medium"><Sparkles className="w-3.5 h-3.5" /> AI 사용 {report?.aiEvents?.length || 0}회</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="h-10 px-4 rounded-xl border border-gray-200 bg-white text-gray-800 font-bold text-sm inline-flex items-center gap-2 disabled:opacity-50 hover:bg-gray-50 shadow-sm transition-all"
                >
                  {isRegenerating ? <Loader2 className="w-4 h-4 animate-spin text-violet-600" /> : <RefreshCw className="w-4 h-4 text-violet-600" />}
                  전체 STT 재분석
                </button>
                <button className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 bg-white shadow-sm transition-all">
                  <MoreHorizontal className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-8 border-b border-gray-100">
              <button 
                onClick={() => setActiveTab('summary')}
                className={`pb-3 text-[15px] font-bold border-b-[3px] transition-all -mb-[2px] ${activeTab === 'summary' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                요약
              </button>
              <button 
                onClick={() => setActiveTab('details')}
                className={`pb-3 text-[15px] font-bold border-b-[3px] transition-all -mb-[2px] ${activeTab === 'details' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-400 hover:text-gray-700'}`}
              >
                상세 회의록
              </button>
            </div>
          </header>
        ) : (
          <header className="h-20 bg-white border-b border-gray-200 px-8 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-2xl font-black text-gray-900">회의 분석</h1>
              <p className="text-sm text-gray-500 mt-1">
                회의 종료 후 전체 STT를 SLM으로 다시 분석해 주제별 progress bar를 생성합니다.
              </p>
            </div>
          </header>
        )}

        {(isLoading || isRegenerating) && (
          <div className="mx-8 mt-5 rounded-3xl bg-violet-50 border border-violet-100 p-6 flex items-center gap-3 text-violet-700 shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
            {isRegenerating ? '회의 전체 STT를 SLM으로 다시 분석 중입니다.' : '회의 분석을 불러오는 중입니다.'}
          </div>
        )}

        {errorText && (
          <div className="mx-8 mt-5 rounded-2xl bg-red-50 text-red-600 px-5 py-4 text-sm shrink-0">
            {errorText}
          </div>
        )}

        {!activeSessionId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            왼쪽 목록에서 회의를 선택해주세요.
          </div>
        ) : !report && !isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <p>표시할 회의 분석이 없습니다.</p>
            <button
              onClick={() => setActiveSessionId(null)}
              className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold hover:bg-gray-50 text-gray-700"
            >
              목록으로 돌아가기
            </button>
          </div>
        ) : report && activeTab === 'summary' ? (
          <main className="flex-1 min-h-0 overflow-y-auto p-8">
            <div className="grid grid-cols-1 xl:grid-cols-[minmax(400px,1fr)_360px] gap-6 items-start">
              
              {/* 왼쪽 영역 */}
              <div className="space-y-6 min-w-0">
                {/* 회의 요약 */}
                {/* 회의 요약 */}
                <section className="bg-white rounded-3xl border border-gray-200 p-7 shadow-sm">
                  <h2 className="text-lg font-black text-gray-900 mb-5 flex items-center gap-2"><Sparkles className="w-5 h-5 text-violet-600" /> 회의 요약</h2>
                  <p className="text-[15px] text-gray-700 mb-7 leading-relaxed">
                    {report.meetingSummary?.summary || '아직 요약 데이터가 없습니다. 상단의 전체 STT 재분석을 눌러주세요.'}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-violet-50/50 border border-violet-100/50">
                      <h3 className="text-[13px] font-bold text-violet-600 mb-3 flex items-center gap-1.5"><Network className="w-4 h-4" /> 핵심 논의</h3>
                      <p className="text-[13px] text-gray-700 font-medium">
                        {report.meetingSummary?.key_points?.[0] || '없음'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                      <h3 className="text-[13px] font-bold text-blue-600 mb-3 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> 주요 결정</h3>
                      <p className="text-[13px] text-gray-700 font-medium">
                        {report.topicBlocks?.flatMap(b => b.decisions || [])[0] || '없음'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                      <h3 className="text-[13px] font-bold text-emerald-600 mb-3 flex items-center gap-1.5"><ArrowRight className="w-4 h-4" /> 다음 단계</h3>
                      <p className="text-[13px] text-gray-700 font-medium">
                        {report.topicBlocks?.flatMap(b => b.next_steps || [])[0] || '없음'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50">
                      <h3 className="text-[13px] font-bold text-amber-600 mb-3 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> 결론</h3>
                      <p className="text-[13px] text-gray-700 font-medium">
                        {report.meetingSummary?.conclusion || '없음'}
                      </p>
                    </div>
                  </div>
                </section>

                {/* 주제별 Progress Bar */}
                <section className="bg-white rounded-3xl border border-gray-200 p-7 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-700" /> 주제별 Progress Bar
                    </h2>
                    <div className="text-xs text-gray-500 font-medium">
                      총 길이 {formatSec(totalSec)} · 주제 {report.topicBlocks?.length || 0}개
                    </div>
                  </div>

                  <div className="relative h-24 rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden">
                    {report.topicBlocks?.map((block, idx) => {
                      const left = (block.startSec / totalSec) * 100
                      const width = Math.max(2, ((block.endSec - block.startSec) / totalSec) * 100)
                      const active = hoverBlockId === block.id || selectedBlock?.id === block.id

                      return (
                        <button
                          key={block.id}
                          onMouseEnter={() => setHoverBlockId(block.id)}
                          onMouseLeave={() => setHoverBlockId(null)}
                          onClick={() => {
                            setSelectedBlock(block)
                            setSelectedAiEvent(null)
                          }}
                          className={`absolute top-0 h-full ${colors[idx % colors.length]} transition-all ${
                            active ? 'brightness-110 scale-y-105 z-10 ring-[3px] ring-black/10 shadow-lg' : 'opacity-95 hover:opacity-100 hover:scale-y-[1.02]'
                          }`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${block.start}~${block.end} ${block.topic}`}
                        >
                          <div className="h-full flex flex-col justify-center text-left px-4 text-white overflow-hidden">
                            <div className="text-[13px] font-black truncate drop-shadow-sm mb-1">{block.topic}</div>
                            <div className="text-xs opacity-90 drop-shadow-sm font-medium">{block.start} - {block.end}</div>
                          </div>
                        </button>
                      )
                    })}

                    {report.aiEvents?.map((event) => {
                      const left = (event.askedAtSec / totalSec) * 100
                      return (
                        <button
                          key={event.id}
                          onClick={() => setSelectedAiEvent(event)}
                          className="absolute top-0 bottom-0 w-[4px] bg-gray-900 z-20 hover:w-[6px] hover:bg-black transition-all"
                          style={{ left: `${left}%` }}
                          title={`AI 질문 [${event.askedAt}] ${event.question}`}
                        >
                          <span className="absolute -top-[14px] -left-2.5 w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center shadow-md">
                            <Bot className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {/* 선택 주제 상세 */}
                  <section className="bg-white rounded-3xl border border-gray-200 p-7 shadow-sm flex flex-col h-full min-h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-700" /> 선택 주제 상세
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-400 font-bold mr-1">주제 변경</span>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600"><ChevronLeft className="w-3.5 h-3.5" /></button>
                        <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 rotate-180"><ChevronLeft className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>

                    {activeBlock ? (
                      <div className="flex-1 flex flex-col min-h-0">
                        <div className="text-sm text-violet-600 font-bold mb-1">[{activeBlock.start} - {activeBlock.end}]</div>
                        <h4 className="text-xl font-black text-gray-900 mb-4">{activeBlock.topic}</h4>
                        <p className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-wrap mb-5">{activeBlock.summary}</p>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                          {(activeBlock.keywords || []).map((kw) => (
                            <span key={kw} className="rounded-full bg-violet-50 border border-violet-100 text-violet-600 px-3 py-1 text-[11px] font-bold">
                              {kw}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto rounded-2xl bg-[#f7f8fb] border border-gray-200/60 p-5 overflow-y-auto custom-scrollbar flex-1">
                          <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {activeBlock.text}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-sm text-gray-400">선택된 주제가 없습니다.</div>
                    )}
                  </section>

                  {/* AI 사용 시점 */}
                  <section className="bg-white rounded-3xl border border-gray-200 p-7 shadow-sm flex flex-col h-full min-h-[400px]">
                    <div className="flex items-center gap-2 mb-6">
                      <Bot className="w-5 h-5 text-gray-700" />
                      <h2 className="text-lg font-black text-gray-900">AI 사용 시점</h2>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden">
                      {selectedAiEvent ? (
                        <div className="w-full">
                          <div className="text-sm text-gray-500 font-bold mb-3">[{selectedAiEvent.askedAt}]</div>
                          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5 mb-4">
                            <div className="text-xs font-black text-gray-400 mb-2">Q. 사용자 질문</div>
                            <div className="text-sm font-semibold text-gray-900">{selectedAiEvent.question}</div>
                          </div>
                          <div className="rounded-2xl bg-violet-50/50 border border-violet-100 p-5">
                            <div className="text-xs font-black text-violet-500 mb-2">A. AI 응답</div>
                            <div className="text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed">{selectedAiEvent.answer || '응답 기록 없음'}</div>
                          </div>
                        </div>
                      ) : report.aiEvents?.length ? (
                        <div className="w-full space-y-3 absolute inset-0 overflow-y-auto custom-scrollbar pr-2">
                          {report.aiEvents.map((event) => (
                            <button
                              key={event.id}
                              onClick={() => setSelectedAiEvent(event)}
                              className="w-full text-left rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-violet-50 hover:border-violet-200 p-5 transition-all group"
                            >
                              <div className="text-xs text-violet-600 font-bold mb-2 group-hover:text-violet-700">[{event.askedAt}]</div>
                              <div className="text-sm font-semibold text-gray-800 line-clamp-2">{event.question}</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center opacity-60">
                          <div className="w-24 h-24 mb-4 bg-violet-100 rounded-full flex items-center justify-center">
                             <Bot className="w-10 h-10 text-violet-500" />
                          </div>
                          <div className="text-sm font-bold text-gray-900 mb-1">기록된 AI 질문이 없습니다.</div>
                          <div className="text-xs text-gray-500">AI 질문이 발생하면 여기에 표시됩니다.</div>
                        </div>
                      )}
                    </div>
                  </section>
                </div>
              </div>


              {/* 오른쪽 영역 (To-Do & 첨부파일) */}
              <aside className="space-y-6 min-w-[360px]">
                {/* To-Do 리스트 */}
                <section className="bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col xl:sticky xl:top-6 min-h-[600px] max-h-[calc(100vh-120px)]">
                  <div className="p-6 pb-0 shrink-0">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <CheckSquare className="w-5 h-5 text-violet-600" /> To-Do
                      </h3>
                    </div>
                    
                    <div className="flex items-center gap-2 border-b border-gray-100 w-full">
                      <button 
                        onClick={() => setTodoTab('ai')}
                        className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${todoTab === 'ai' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                      >
                        AI 추천 ({aiTodos.length})
                      </button>
                      <button 
                        onClick={() => setTodoTab('registered')}
                        className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-colors ${todoTab === 'registered' ? 'border-violet-600 text-violet-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}
                      >
                        등록된 To-Do ({registeredTodos.length})
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                    {isAddingTodo ? (
                      <div className="h-full flex flex-col">
                        <div className="flex items-center gap-2 mb-6">
                          <button onClick={() => setIsAddingTodo(false)} className="text-gray-500 hover:text-gray-900 px-2 py-1 -ml-2">
                            ←
                          </button>
                          <h4 className="font-bold text-gray-900">직접 To-Do 추가</h4>
                        </div>
                        
                        <div className="space-y-4 flex-1">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">작업 이름</label>
                            <input type="text" value={newTodo.title} onChange={e => setNewTodo({...newTodo, title: e.target.value})} placeholder="작업 내용을 입력하세요" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">마감 기한</label>
                            <input type="date" value={newTodo.dueDate} onChange={e => setNewTodo({...newTodo, dueDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm text-gray-700" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1.5">우선 순위</label>
                            <select value={newTodo.priority} onChange={e => setNewTodo({...newTodo, priority: e.target.value})} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm text-gray-700">
                              <option value="high">높음 (High)</option>
                              <option value="medium">중간 (Medium)</option>
                              <option value="low">낮음 (Low)</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                          <button onClick={() => setIsAddingTodo(false)} className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50">취소</button>
                          <button onClick={handleAddTodo} className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-sm transition-colors">추가하기</button>
                        </div>
                      </div>
                    ) : todoTab === 'ai' ? (
                      <>
                        <div className="flex items-center justify-end mb-4">
                          <button 
                            className="text-[13px] font-bold text-violet-600 hover:text-violet-700"
                            onClick={() => {
                              const allSelected = aiTodos.every(t => t.selected);
                              setAiTodos(prev => prev.map(t => ({...t, selected: !allSelected})));
                            }}
                          >
                            전체 선택
                          </button>
                        </div>
                        
                        <div className="space-y-3 pb-24">
                          {aiTodos.map(todo => (
                            <div key={todo.id} className={`p-4 rounded-2xl border transition-colors flex items-center gap-3 ${todo.selected ? 'border-violet-200 bg-white shadow-sm' : 'border-gray-100 bg-gray-50'}`}>
                              <button onClick={() => toggleAiTodo(todo.id)} className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full overflow-hidden border border-gray-300">
                                {todo.selected ? (
                                  <div className="w-full h-full bg-violet-600 flex items-center justify-center border-violet-600">
                                    <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-full h-full bg-white" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <h4 className={`text-sm font-bold truncate mb-2 ${todo.selected ? 'text-gray-900' : 'text-gray-500'}`}>{todo.title}</h4>
                                <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                  <span className="flex items-center gap-1 font-semibold text-gray-600"><Calendar className="w-3.5 h-3.5" /> {todo.date || '날짜 미정'}</span>
                                  <PriorityBadge level={todo.priority} />
                                </div>
                              </div>
                              <button className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 flex flex-col gap-3 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.02)] rounded-b-3xl">
                          <button onClick={() => setIsAddingTodo(true)} className="w-full h-10 rounded-xl border border-gray-200 text-gray-600 font-bold text-[13px] flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
                            <Plus className="w-4 h-4" /> 직접 추가
                          </button>
                          <button onClick={handleRegisterSelectedAiTodos} className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-[13px] shadow-md transition-all">
                            선택 항목 To-Do로 등록 ({aiTodos.filter(t => t.selected).length})
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-3">
                        {registeredTodos.map(todo => (
                          <div key={todo.id} className="p-4 rounded-2xl border border-gray-200 bg-white shadow-sm flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-gray-900 truncate mb-2">{todo.title}</h4>
                              <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                                <span className="flex items-center gap-1 font-semibold text-gray-600"><Calendar className="w-3.5 h-3.5" /> {todo.date || '날짜 미정'}</span>
                                <PriorityBadge level={todo.priority} />
                              </div>
                            </div>
                            <button className="shrink-0 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                               <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        {registeredTodos.length === 0 && (
                          <div className="text-sm text-gray-500 text-center mt-10">
                            등록된 To-Do가 없습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                {/* 첨부파일 (placeholder) */}
                <section className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-gray-700" />
                    <h3 className="text-[15px] font-black text-gray-900">첨부파일</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-[10px] font-black">PDF</div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">디자인 QA 피드백.pdf</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">2.4MB</div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">FIG</div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">대시보드_개선안_v2.fig</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">18.7MB</div>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600"><ChevronDown className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <button className="mt-4 w-full h-10 rounded-xl border border-dashed border-gray-300 text-gray-500 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
                    <Plus className="w-3.5 h-3.5" /> 첨부파일 추가
                  </button>
                </section>
              </aside>
            </div>
          </main>
        ) : report && activeTab === 'details' ? (
          <main className="flex-1 min-h-0 overflow-y-auto p-8">
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 max-w-[1000px] mx-auto">
              {/* 마크다운 회의록 */}
              <div className="prose prose-violet max-w-none mb-12">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="text-2xl font-black text-gray-900 mt-8 mb-6 pb-4 border-b border-gray-100" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-[17px] font-bold text-violet-700 mt-8 mb-4 flex items-center gap-2 before:content-[''] before:block before:w-1.5 before:h-4 before:bg-violet-600 before:rounded-full" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-[15px] font-bold text-gray-900 mt-6 mb-3" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc pl-5 my-4 space-y-2.5 marker:text-violet-400 text-gray-700 leading-relaxed text-[15px]" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal pl-5 my-4 space-y-2.5 marker:text-violet-600 marker:font-bold text-gray-700 leading-relaxed text-[15px]" {...props} />,
                    li: ({node, ...props}) => <li className="pl-1" {...props} />,
                    p: ({node, ...props}) => <p className="my-4 text-gray-700 leading-relaxed text-[15px]" {...props} />,
                    strong: ({node, ...props}) => <strong className="font-black text-gray-900 bg-violet-50/50 px-1 rounded" {...props} />,
                  }}
                >
                  {report.minutesMarkdown || '# 회의록 생성 중...'}
                </ReactMarkdown>
              </div>

              {/* STT 원문 */}
              {transcript && (
                <div className="border-t border-gray-200 pt-10 mt-12">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[17px] font-black text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-gray-700" /> STT 원문
                    </h3>
                  </div>
                  
                  <div className="rounded-2xl bg-[#f7f8fb] border border-gray-200/60 p-6 space-y-5">
                    {transcript.transcriptLines?.map((line, idx) => (
                      <div key={idx} className="flex items-start gap-4 pb-5 border-b border-gray-200/50 last:border-0 last:pb-0">
                        <div className="w-14 shrink-0 text-[11px] font-bold text-violet-600 pt-0.5">[{line.start}]</div>
                        <div className="w-14 shrink-0 text-[13px] font-black text-gray-900 pt-0">{line.speaker}</div>
                        <div className="flex-1 text-[13px] text-gray-700 leading-relaxed pt-0">{line.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        ) : null}
      </div>
      </>
      )}
    </div>
  )
}
