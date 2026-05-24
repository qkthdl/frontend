import React, { useState, useEffect } from 'react'
import { fetchRoomSessions, fetchCalendarEvents } from '../services/roomApi'
import { getMeetingReport } from '../services/meetingReportService'
import { fetchLibraryItems } from '../services/libraryApi'
import {
  Star,
  Video,
  ChevronDown,
  MoreHorizontal,
  ChevronRight,
  Pin,
  FileText,
  LayoutGrid,
  List,
  ChevronLeft,
  Plus,
  ArrowRight,
  Clock,
  Check,
  Loader2
} from 'lucide-react'

export default function ChannelHome({ setActiveView, roomName, channelId, onOpenReport }) {
  const [activeTab, setActiveTab] = useState('home')
  const [recentMeetings, setRecentMeetings] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [mostRecentReport, setMostRecentReport] = useState(null)
  const [isReportLoading, setIsReportLoading] = useState(false)
  const [libraryItems, setLibraryItems] = useState([])

  useEffect(() => {
    if (roomName) {
      fetchRoomSessions(roomName, channelId)
        .then(data => {
          if (data?.sessions) {
            setRecentMeetings(data.sessions)
            if (data.sessions.length > 0) {
              const latestSession = data.sessions[0]
              setIsReportLoading(true)
              getMeetingReport(latestSession.id)
                .then(report => setMostRecentReport(report))
                .catch(err => console.error("Failed to load latest meeting report", err))
                .finally(() => setIsReportLoading(false))
            }
          }
        })
        .catch(err => console.error("Failed to load meetings", err))

      fetchCalendarEvents(roomName, channelId)
        .then(data => {
          if (data?.events) {
            setUpcomingEvents(data.events.filter(e => new Date(e.date || e.startTime) >= new Date()).sort((a, b) => new Date(a.date || a.startTime) - new Date(b.date || b.startTime)))
          }
        })
        .catch(err => console.error("Failed to load events", err))
      // Fetch Library Items
      fetchLibraryItems(roomName).then((res) => {
        if (res.ok && res.items) {
          setLibraryItems(res.items)
        }
      }).catch((e) => console.error("Failed to load library items:", e))

    }
  }, [roomName, channelId])

  return (
    <div className="h-full overflow-y-auto bg-[#f9fafb]">

      <div className="p-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-[1fr_320px] gap-8">
          
          {/* Left Column */}
          <div className="space-y-8 min-w-0">
            
            {/* 가장 최근 회의 */}
            {recentMeetings.length > 0 && (
              <section className="bg-white rounded-3xl p-7 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden">
                <div className="inline-flex items-center justify-center px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold mb-6">가장 최근 회의</div>
                
                {(() => {
                  const latest = recentMeetings[0];
                  const dateObj = new Date(latest.createdAt);
                  const month = `${dateObj.getMonth() + 1}.${String(dateObj.getDate()).padStart(2, '0')}`;
                  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                  const day = dayNames[dateObj.getDay()];
                  
                  let duration = '시간 미상';
                  if (latest.meetingTime) {
                    const timeParts = latest.meetingTime.split('T');
                    if (timeParts.length > 1) {
                      duration = timeParts[1].substring(0, 5);
                    } else {
                      duration = latest.meetingTime;
                    }
                  }

                  return (
                    <div className="flex flex-col gap-6">
                      <div className="flex gap-8">
                        <div className="w-24 h-28 rounded-2xl bg-white border border-indigo-100 flex flex-col items-center justify-center shrink-0 shadow-sm shadow-indigo-100/50">
                          <span className="text-3xl font-black text-indigo-600 tracking-tight mb-1">{month}</span>
                          <span className="text-sm font-bold text-indigo-500">{day}요일</span>
                        </div>
                        
                        <div className="flex-1">
                          <h2 className="text-2xl font-black text-gray-900 mb-3">{latest.title}</h2>
                          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium mb-6">
                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {duration}</span>
                          </div>
                          
                          <div className="mt-2">
                            <h3 className="text-sm font-bold text-indigo-600 mb-3">요약</h3>
                            <div className="text-[13px] text-gray-700 leading-relaxed min-h-[60px]">
                              {isReportLoading ? (
                                <span className="flex items-center gap-2 text-gray-400 font-medium">
                                  <Loader2 className="w-4 h-4 animate-spin" /> 요약을 불러오는 중입니다...
                                </span>
                              ) : mostRecentReport?.meetingSummary?.summary ? (
                                <ul className="list-disc pl-4 space-y-2 marker:text-gray-300">
                                  {mostRecentReport.meetingSummary.summary.split('\n').map((line, idx) => {
                                    const text = line.replace(/^- /, '').trim()
                                    return text ? <li key={idx} className="font-medium text-gray-700">{text}</li> : null
                                  })}
                                </ul>
                              ) : (
                                <span className="text-gray-400 font-medium">요약된 내용이 없습니다.</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="hidden lg:flex shrink-0 w-32 h-32 items-center justify-center">
                          <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-purple-50 rounded-[24px] flex items-center justify-center shadow-inner relative transform rotate-6">
                            <FileText className="w-10 h-10 text-indigo-400 opacity-80" />
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg border-2 border-white transform -rotate-6">
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <button 
                          onClick={() => onOpenReport?.(latest.id)}
                          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] transition-all flex items-center gap-2 w-fit"
                        >
                          상세 보러가기 <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </section>
            )}

            {/* 최근 회의 */}
            <section className="bg-white rounded-[24px] p-7 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-900 text-lg">최근 회의</h2>
                <button className="text-blue-500 font-bold text-sm flex items-center gap-1 hover:text-blue-600">전체 회의 보기 <ChevronRight className="w-4 h-4"/></button>
              </div>

                {recentMeetings.length <= 1 ? (
                  <div className="text-sm text-gray-500 py-4 text-center">다른 최근 회의가 없습니다.</div>
                ) : (
                  recentMeetings.slice(1, 5).map(m => {
                    const dateObj = new Date(m.createdAt)
                    const month = `${dateObj.getMonth() + 1}.${String(dateObj.getDate()).padStart(2, '0')}`
                    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
                    const day = dayNames[dateObj.getDay()]
                    const duration = m.meetingTime ? `${m.meetingTime}분` : '시간 미상'
                    
                    return (
                      <RecentMeetingItem 
                        key={m.id}
                        month={month} 
                        day={day}
                        title={m.title} 
                        time={duration} 
                        people="팀원"
                        onClick={() => onOpenReport?.(m.id)}
                      />
                    )
                  })
                )}
            </section>

            {/* 중요한 회의록 */}
            <section>
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <Pin className="w-5 h-5 text-gray-700 fill-gray-700" />
                  <h2 className="font-bold text-gray-900 text-lg">중요한 회의록</h2>
                </div>
                <button className="text-gray-400 hover:text-gray-600 font-bold text-[13px] flex items-center gap-1">
                  더보기 <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {recentMeetings.length === 0 ? (
                  <div className="col-span-3 text-sm text-gray-500 py-4 text-center border border-gray-100 rounded-2xl bg-white">중요 회의록이 없습니다.</div>
                ) : (
                  recentMeetings.slice(0, 3).map(m => {
                    const dateObj = new Date(m.createdAt)
                    const dateStr = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`
                    
                    return (
                      <ImportantMinuteCard 
                        key={m.id}
                        title={m.title} 
                        date={dateStr} 
                        author={m.createdBy || '팀원'} 
                        active={true} 
                        onClick={() => onOpenReport?.(m.id)}
                      />
                    )
                  })
                )}
              </div>
            </section>

            {/* 회의 자료 / STT 보관함 */}
            <section className="bg-white rounded-[24px] p-7 shadow-sm border border-gray-100">
              <h2 className="font-bold text-gray-900 text-lg mb-5">회의 자료 / STT 보관함</h2>
              
              <div className="flex items-center justify-between mb-6">
                <div className="flex gap-2">
                  <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[13px] font-bold cursor-pointer">
                    전체 {libraryItems.length}
                  </span>
                  <span className="px-4 py-1.5 border border-gray-200 text-gray-500 rounded-full text-[13px] font-bold cursor-pointer hover:bg-gray-50">
                    회의 자료 {libraryItems.filter(i => i.kind !== 'STT' && i.kind !== 'TXT').length}
                  </span>
                  <span className="px-4 py-1.5 border border-gray-200 text-gray-500 rounded-full text-[13px] font-bold cursor-pointer hover:bg-gray-50">
                    STT {libraryItems.filter(i => i.kind === 'STT' || i.kind === 'TXT').length}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-1 text-gray-500 text-[13px] font-bold">
                    최신순 <ChevronDown className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
                    <div className="p-1 bg-white rounded shadow-sm text-indigo-500 cursor-pointer">
                      <LayoutGrid className="w-4 h-4" />
                    </div>
                    <div className="p-1 text-gray-400 cursor-pointer hover:text-gray-600">
                      <List className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {libraryItems.length > 0 ? (
                  libraryItems.map((item) => {
                    let color = 'bg-gray-500'
                    if (item.kind === 'PDF') color = 'bg-rose-500'
                    if (item.kind === 'TXT' || item.kind === 'STT') color = 'bg-blue-500'
                    if (item.kind === 'PPT') color = 'bg-amber-500'
                    if (item.kind === 'IMG') color = 'bg-indigo-500'
                    
                    const dateObj = new Date(item.created_at)
                    const dateStr = `${dateObj.getFullYear()}.${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`

                    return (
                      <FileCard 
                        key={item.id} 
                        type={item.kind} 
                        color={color} 
                        title={item.name} 
                        date={dateStr} 
                        author={item.created_by || '팀원'} 
                        size={item.size || '0MB'} 
                      />
                    )
                  })
                ) : (
                  <div className="col-span-4 text-sm text-gray-500 py-6 text-center border border-gray-100 rounded-2xl bg-gray-50/50">자료가 없습니다.</div>
                )}
              </div>
            </section>
            
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            <section className="bg-white rounded-[24px] p-7 shadow-sm border border-gray-100 sticky top-32">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-bold text-gray-900 text-[15px]">예정된 일정</h2>
                <button onClick={() => setActiveView?.('channel-calendar')} 
                  className="text-blue-500 font-bold text-xs hover:text-blue-600 transition">전체 캘린더</button>
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="font-bold text-gray-900 text-sm">2026년 5월</div>
                <div className="flex gap-1">
                  <button className="p-1 border border-gray-100 rounded hover:bg-gray-50">
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                  </button>
                  <button className="p-1 border border-gray-100 rounded hover:bg-gray-50">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <div className="space-y-5 mb-6">
                {upcomingEvents.length === 0 ? (
                  <div className="text-sm text-gray-500 py-4 text-center">예정된 일정이 없습니다.</div>
                ) : (
                  upcomingEvents.slice(0, 3).map(e => {
                    const dateObj = new Date(e.date || e.startTime)
                    const dayNames = ['일', '월', '화', '수', '목', '금', '토']
                    const day = dayNames[dateObj.getDay()]
                    const dateStr = String(dateObj.getDate())
                    let timeStr = '하루 종일'
                    if (e.startTime) {
                      const st = new Date(e.startTime)
                      timeStr = `${String(st.getHours()).padStart(2, '0')}:${String(st.getMinutes()).padStart(2, '0')}`
                      if (e.endTime) {
                        const et = new Date(e.endTime)
                        timeStr += ` - ${String(et.getHours()).padStart(2, '0')}:${String(et.getMinutes()).padStart(2, '0')}`
                      }
                    }

                    return (
                      <ScheduleItem 
                        key={e.id}
                        date={dateStr} 
                        day={day} 
                        title={e.title} 
                        time={timeStr} 
                      />
                    )
                  })
                )}
              </div>

              <button className="w-full py-3 flex items-center justify-center gap-1 text-indigo-500 font-bold text-sm hover:bg-indigo-50 rounded-xl transition-colors">
                <Plus className="w-4 h-4" /> 일정 추가
              </button>
            </section>
          </div>

        </div>
      </div>
    </div>
  )
}

function RecentMeetingItem({ month, day, title, time, people, onClick }) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors group last:border-0">
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-center justify-center min-w-[50px]">
          <span className="text-indigo-600 font-black text-[15px]">{month}</span>
          <span className="text-gray-400 text-[11px] font-bold">{day}요일</span>
        </div>
        
        <div>
          <div className="font-bold text-[14px] text-gray-900 mb-1">{title}</div>
          <div className="flex items-center gap-3 text-[12px] text-gray-500 font-medium">
            <span>{time}</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onClick}
        className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all"
      >
        상세 보러가기 <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

function ImportantMinuteCard({ title, date, author, active, onClick }) {
  return (
    <div onClick={onClick} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="pr-2">
          <div className="font-bold text-[13px] text-gray-900 leading-tight mb-1.5 line-clamp-2">{title}</div>
          <div className="text-[11px] text-gray-400 font-medium">
            {date} · {author}
          </div>
        </div>
      </div>
      {active && (
        <Pin className="absolute bottom-4 right-4 w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
      )}
    </div>
  )
}

function FileCard({ type, color, title, date, author, size }) {
  return (
    <div className="border border-gray-100 rounded-2xl p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
      <div className={`w-9 h-9 rounded-lg ${color} text-white flex items-center justify-center text-[11px] font-black mb-3 shadow-sm`}>
        {type}
      </div>
      <div className="font-bold text-[13px] text-gray-900 leading-tight mb-1.5 truncate" title={title}>{title}</div>
      <div className="text-[11px] text-gray-400 font-medium space-y-0.5">
        <div>{date} · {author}</div>
        <div>{size}</div>
      </div>
    </div>
  )
}

function ScheduleItem({ date, day, title, time }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex flex-col items-center min-w-[24px]">
        <span className="font-black text-gray-900 text-base leading-none mb-1">{date}</span>
        <span className="text-[11px] text-gray-400 font-bold">{day}</span>
      </div>
      <div className="border-l-[3px] border-indigo-100 pl-3.5 py-0.5">
        <div className="font-bold text-[13px] text-gray-800 mb-1">{title}</div>
        <div className="text-gray-400 text-[11px] font-medium">{time}</div>
      </div>
    </div>
  )
}