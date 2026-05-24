import React, { useEffect, useState } from 'react'
import { Calendar, Clock, X, Loader2 } from 'lucide-react'
import { fetchCalendarEvents } from '../services/roomApi'

export default function EventSelectModal({ roomName, channelId, onClose, onSelect }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const data = await fetchCalendarEvents(roomName, channelId)
        // Filter out past events, or just show events for today and future
        const now = new Date()
        now.setHours(0,0,0,0)

        let loadedEvents = data?.events || []
        
        // Sort by date/time
        loadedEvents.sort((a, b) => {
          const timeA = a.startTime ? new Date(a.startTime).getTime() : new Date(a.date).getTime()
          const timeB = b.startTime ? new Date(b.startTime).getTime() : new Date(b.date).getTime()
          return timeA - timeB
        })

        // filter upcoming (including today)
        loadedEvents = loadedEvents.filter(ev => {
           const evDate = ev.startTime ? new Date(ev.startTime) : new Date(ev.date)
           evDate.setHours(0,0,0,0)
           return evDate.getTime() >= now.getTime()
        })

        setEvents(loadedEvents)
      } catch (err) {
        setError(err.message || '일정을 불러오지 못했습니다.')
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [roomName, channelId])

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-black text-gray-800">캘린더 일정 선택</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-gray-500 font-bold text-sm">일정을 불러오는 중입니다...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500 font-bold text-sm">
              {error}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-bold">예정된 일정이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map(ev => {
                const dateObj = ev.startTime ? new Date(ev.startTime) : new Date(ev.date)
                const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
                
                let timeStr = '시간 미정'
                if (ev.startTime) {
                  const hours = dateObj.getHours()
                  const minutes = String(dateObj.getMinutes()).padStart(2, '0')
                  const ampm = hours >= 12 ? '오후' : '오전'
                  const displayHours = hours % 12 || 12
                  timeStr = `${ampm} ${displayHours}:${minutes}`
                }

                return (
                  <div
                    key={ev.id}
                    onClick={() => onSelect(ev)}
                    className="bg-white border border-gray-200 hover:border-indigo-400 hover:shadow-md rounded-2xl p-4 cursor-pointer transition-all flex items-start gap-4 group"
                  >
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex flex-col items-center justify-center text-indigo-600 flex-shrink-0 border border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <span className="text-[10px] font-black opacity-80">{dateObj.getMonth() + 1}월</span>
                      <span className="text-[18px] font-black leading-none">{dateObj.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-bold text-gray-800 truncate mb-1">
                        {ev.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {timeStr}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
