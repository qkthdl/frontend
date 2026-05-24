import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
  Clock, MapPin, CheckCircle2, User, Bell, Paperclip, Repeat,
  Plus, Pin, ArrowRight, Filter, PanelRightClose, PanelRightOpen
} from 'lucide-react';
import { fetchChannels, fetchCalendarEvents, createCalendarEvent, deleteCalendarEvent, fetchRoomSessions } from '../services/roomApi';

const generateTimeOptions = () => {
  const options = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 30) {
      const ampm = i < 12 ? '오전' : '오후';
      const hour = i % 12 === 0 ? 12 : i % 12;
      const minute = j === 0 ? '00' : j;
      options.push(`${ampm} ${hour}:${minute}`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

  const CalendarView = ({ isEmbedded=false, roomName, channelId, filterChannel, onOpenReport }) => {
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const [channelColors, setChannelColors] = useState({
    '개인 (Private)': '#f43f5e'
  });

  const [calendarMode, setCalendarMode] = useState('team');
  const [activeChannels, setActiveChannels] = useState([]);
  const [events, setEvents] = useState([]);

  const [pinnedEvents, setPinnedEvents] = useState([]);
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');

  const [startTime, setStartTime] = useState('오전 9:00');
  const [endTime, setEndTime] = useState('오전 10:00');
  const [isStartOpen, setIsStartOpen] = useState(false);
  const [isEndOpen, setIsEndOpen] = useState(false);

  const sidebarRef = useRef(null);
  const clickRef = useRef(null);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        if (!roomName) return;
        const data = await fetchChannels(roomName);
        const channelArray = Array.isArray(data) ? data : (data?.channels || []);

        const newColors = { '개인 (Private)': '#f43f5e' };
        
        channelArray.forEach((ch, idx) => {
          const id = ch.id || ch.name;
          const name = ch.channelName || ch.name || ch.id;
          // Assign a nice color if none exists
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
          const color = ch.color || colors[idx % colors.length];
          if (name) newColors[name] = { id, color };
        });

        setChannelColors(newColors);

        const channelNames = Object.keys(newColors).filter(k => k !== '개인 (Private)');

        if (channelId) {
          const matchedName = channelNames.find(name => newColors[name].id === channelId) || channelId;
          setSelectedChannel(matchedName);
          setActiveChannels([matchedName]);
        } else if (filterChannel && newColors[filterChannel]) {
          setSelectedChannel(filterChannel);
          setActiveChannels([filterChannel]);
        } else if (channelNames.length > 0) {
          // Workspace dashboard: default to all channels
          setSelectedChannel(channelNames[0]);
          setActiveChannels(channelNames);
        } else {
          setActiveChannels([]);
        }
      } catch (error) {
        console.error('Failed to fetch channels:', error);
      }
    };

    loadChannels();
  }, [roomName, channelId, filterChannel]);

  useEffect(() => {
    if (activeChannels.length === 0) return;

    const loadActiveChannelEvents = async () => {
      try {
        const channels = activeChannels.filter(ch => ch !== '개인 (Private)');

        if (channels.length === 0) {
          setEvents([]);
          return;
        }

        const eventResults = await Promise.all(
          channels.map(channelName => fetchCalendarEvents(roomName, channelColors[channelName]?.id || channelName))
        );

        const sessionResults = await Promise.all(
          channels.map(channelName => fetchRoomSessions(roomName, channelColors[channelName]?.id || channelName).catch(() => ({ sessions: [] })))
        );

        const mergedEvents = eventResults.flatMap(eventsData =>
          (eventsData.events || []).map(ev => {
            const chName = Object.keys(channelColors).find(k => channelColors[k].id === ev.channelId) || ev.channelId || ev.channel || ev.roomName;
            return {
              id: ev.id,
              title: ev.title,
              date: ev.startTime ? ev.startTime.split('T')[0] : ev.date,
              start: ev.startTime ? ev.startTime.split('T')[0] : ev.date,
              channel: chName,
              isPrivate: ev.isPrivate,
              backgroundColor: channelColors[chName]?.color || ev.color || '#3b82f6',
              borderColor: channelColors[chName]?.color || ev.color || '#3b82f6',
              isMeeting: false
            };
          })
        );

        const mergedSessions = sessionResults.flatMap(sessionData => 
          (sessionData.sessions || []).map(session => {
            const chName = Object.keys(channelColors).find(k => channelColors[k].id === session.channelId) || session.channelId || session.channel || session.roomName;
            return {
              id: session.id,
              title: session.title || '진행된 회의',
              date: session.createdAt ? session.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
              start: session.createdAt ? session.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
              channel: chName,
              isPrivate: false,
              backgroundColor: channelColors[chName]?.color || '#3b82f6',
              borderColor: channelColors[chName]?.color || '#3b82f6',
              isMeeting: true
            };
          })
        );

        setEvents([...mergedEvents, ...mergedSessions]);
      } catch (error) {
        console.error('Failed to fetch active channel events:', error);
      }
    };

    loadActiveChannelEvents();
  }, [activeChannels, channelColors]);

  const toggleChannel = (channel) => {
    setActiveChannels(prev =>
      prev.includes(channel)
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  const handleDeletePinnedEvent = (id) => {
    setPinnedEvents(prev => prev.filter(ev => ev.id !== id));
  };

  const handleEventDragStop = (info) => {
    if (!sidebarRef.current) return;

    const sidebarRect = sidebarRef.current.getBoundingClientRect();
    const { clientX, clientY } = info.jsEvent;

    const isInsideSidebar =
      clientX >= sidebarRect.left &&
      clientX <= sidebarRect.right &&
      clientY >= sidebarRect.top &&
      clientY <= sidebarRect.bottom;

    if (isInsideSidebar) {
      const draggedEvent = info.event;

      if (!pinnedEvents.find(e => e.id === draggedEvent.id)) {
        setPinnedEvents(prev => [
          ...prev,
          {
            id: draggedEvent.id,
            title: draggedEvent.title,
            date: draggedEvent.startStr
          }
        ]);
      }
    }
  };

  const handleDateClick = (arg) => {
  setSelectedDate(arg.dateStr);

  const channels = Object.keys(channelColors).filter(ch => ch !== '개인 (Private)');

  if (!selectedChannel && channels.length > 0) {
    setSelectedChannel(channels[0]);
  }

  if (clickRef.current) {
    clearTimeout(clickRef.current);
    clickRef.current = null;
    setIsModalOpen(true);
  } else {
    clickRef.current = setTimeout(() => {
      clickRef.current = null;
    }, 300);
  }
};

  const handleSaveEvent = async () => {
    if (!newEventTitle.trim()) return;

    if (calendarMode === 'team' && (!selectedChannel || selectedChannel === '개인 (Private)')) {
      alert('일정을 저장할 팀 채널을 선택해주세요.');
      return;
    }

    if (!selectedChannel) {
      alert('일정을 저장할 채널을 선택해주세요.');
      return;
    }

    const isPrivate = selectedChannel === '개인 (Private)';
    const color = isPrivate ? '#f43f5e' : (channelColors[selectedChannel]?.color || '#3b82f6');
    const channelIdToSave = isPrivate ? null : (channelColors[selectedChannel]?.id || selectedChannel);

    try {
      const savedEvent = await createCalendarEvent(roomName, channelIdToSave, {
        title: newEventTitle,
        startTime: `${selectedDate}T09:00:00`,
        endTime: `${selectedDate}T10:00:00`,
        description: '',
        isPrivate,
        color
      });

      const chName = Object.keys(channelColors).find(k => channelColors[k].id === savedEvent.channelId) || savedEvent.channelId || selectedChannel;

      const newEvent = {
        id: savedEvent.id,
        title: savedEvent.title,
        date: savedEvent.startTime.split('T')[0],
        start: savedEvent.startTime.split('T')[0],
        channel: chName,
        isPrivate: savedEvent.isPrivate,
        backgroundColor: savedEvent.color || color,
        borderColor: savedEvent.color || color,
        isMeeting: false
      };

      setEvents(prevEvents => [...prevEvents, newEvent]);

      setActiveChannels(prevChannels =>
        prevChannels.includes(chName)
          ? prevChannels
          : [...prevChannels, chName]
      );

      setIsModalOpen(false);
      setNewEventTitle('');
      setStartTime('오전 9:00');
      setEndTime('오전 10:00');
    } catch (error) {
      console.error('Failed to save event:', error);
      alert('일정 저장에 실패했습니다.');
    }
  };

  const renderEventContent = (eventInfo) => {
    const isMeeting = eventInfo.event.extendedProps.isMeeting;
    const bgColor = eventInfo.event.backgroundColor || '#3b82f6';

    return (
      <div
        className="relative w-full rounded-[6px] px-2 py-1 flex items-center shadow-sm cursor-pointer border border-transparent hover:brightness-95 transition-all mt-0.5"
        style={{ backgroundColor: bgColor, color: '#fff' }}
      >
        <span className="text-[11px] font-bold truncate leading-tight w-full">
          {eventInfo.event.title}
        </span>
        {isMeeting && (
          <div className="absolute -top-3.5 -right-1.5 bg-gray-600 text-white text-[9px] px-1.5 py-[2px] rounded-md shadow-md flex items-center justify-center font-bold z-10 whitespace-nowrap">
            회의록
            <div className="absolute -bottom-1 left-2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-gray-600" />
          </div>
        )}
      </div>
    );
  };
//캘린더 채널 보이기
  const filteredEvents = events.filter(ev => {
    if (calendarMode === 'team' && ev.isPrivate) return false;
    if (filterChannel && !activeChannels.includes(filterChannel)) {
      return false;
    }
    if (!activeChannels.includes(ev.channel)) return false;
    return true;
  });

  const selYear = selectedDate.split('-')[0];
  const selMonth = parseInt(selectedDate.split('-')[1], 10);
  const selDay = parseInt(selectedDate.split('-')[2], 10);

  return (
    <div className="w-full h-full bg-[#fbfcff] font-sans flex overflow-hidden relative text-slate-900">
      <style>{`
        .fc { font-family: 'Inter', 'Pretendard', sans-serif; }
        .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 900 !important; color: #0f172a; letter-spacing: -0.02em; }
        .fc-button-primary { background-color: #ffffff !important; color: #475569 !important; border: 1px solid #e2e8f0 !important; border-radius: 0.5rem !important; font-weight: bold !important; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: all 0.2s; }
        .fc-button-primary:hover { background-color: #f8fafc !important; color: #0f172a !important; border-color: #cbd5e1 !important; }
        .fc-col-header-cell { padding: 14px 0 !important; background-color: #ffffff; border-bottom: 1px solid #f1f5f9; color: #64748b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; border-right: none !important; }
        .fc-daygrid-day-number { color: #334155; font-weight: 700; font-size: 0.85rem; padding: 12px 12px 4px 12px !important; }
        .fc-day-today .fc-daygrid-day-number { background-color: #4f46e5; color: white; border-radius: 50%; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; margin: 8px; padding: 0 !important; font-weight: 900; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.3); }
        .fc-day-today { background-color: #fcfdff !important; }
        .fc-event { background: transparent !important; border: none !important; margin-bottom: 2px; padding: 0 4px; overflow: visible !important; }
        .fc-daygrid-event-harness { z-index: auto !important; }
        .fc-scrollgrid { border: none !important; }
        td, th { border-color: #f1f5f9 !important; }
        .selected-date-highlight { background-color: #f8fafc !important; transition: background-color 0.2s; box-shadow: inset 0 0 0 2px #e2e8f0; border-radius: 12px; }
        .fc-view-harness { border-radius: 16px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); background: white; }
        .fc-daygrid-day-events { min-height: 40px !important; }
      `}</style>

      <div className="flex-1 bg-white px-10 py-8 flex flex-col h-full overflow-hidden border-r border-gray-100">
        <div className="flex flex-col mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
              {calendarMode === 'team' ? '팀 공유 일정' : '내 개인 일정'}
            </h2>

            <div className="flex items-center gap-3">
              <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner">
                <button
                  onClick={() => setCalendarMode('team')}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${calendarMode === 'team' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  팀 공유 캘린더
                </button>
                <button
                  onClick={() => setCalendarMode('personal')}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${calendarMode === 'personal' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  내 개인 캘린더
                </button>
              </div>

              {!isEmbedded && (
                <button
                  onClick={() => setIsRightSidebarOpen(!isRightSidebarOpen)}
                  className="flex items-center justify-center w-9 h-9 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                  title="우측 사이드바 토글"
                >
                  {isRightSidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mr-2">
              <Filter size={14} /> 채널 필터
            </div>

            {Object.entries(channelColors).map(([channelName, channelData]) => {
              if (calendarMode === 'team' && channelName === '개인 (Private)') return null;

              const isActive = activeChannels.includes(channelName);
              const color = channelName === '개인 (Private)' ? channelData : channelData.color;

              return (
                <button
                  key={channelName}
                  onClick={() => toggleChannel(channelName)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] font-bold transition-all duration-200 border ${isActive ? 'bg-white text-slate-700 shadow-sm' : 'bg-transparent text-slate-400 opacity-60 hover:opacity-100'}`}
                  style={{ borderColor: isActive ? color + '40' : '#e2e8f0' }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: isActive ? color : '#cbd5e1' }}
                  />
                  {channelName}
                </button>
              );
            })}
          </div>
        </div>

        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          initialDate={todayStr}
          events={filteredEvents}
          eventContent={renderEventContent}
          editable={true}
          eventDragStop={handleEventDragStop}
          dateClick={handleDateClick}
          eventClick={async (info) => {
             const ev = info.event;
             if (ev.extendedProps.isMeeting && onOpenReport) {
                onOpenReport(ev.id);
             } else if (!ev.extendedProps.isMeeting) {
                if (window.confirm(`'${ev.title}' 일정을 삭제하시겠습니까?`)) {
                  try {
                    await deleteCalendarEvent(roomName, ev.id);
                    setEvents(prev => prev.filter(e => e.id !== ev.id));
                  } catch (e) {
                    alert('삭제 실패: ' + e.message);
                  }
                }
             }
          }}
          dayCellClassNames={(arg) => {
            const dateStr = new Date(
              arg.date.getTime() - arg.date.getTimezoneOffset() * 60000
            ).toISOString().split('T')[0];

            return dateStr === selectedDate ? 'selected-date-highlight' : '';
          }}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,dayGridWeek'
          }}
          height="100%"
        />
      </div>

      <div
        ref={sidebarRef}
        className={`flex-shrink-0 bg-white flex flex-col h-full overflow-y-auto custom-scrollbar transition-all duration-300 ease-in-out border-slate-100 ${
          isEmbedded
            ? 'w-[330px] px-7 py-8 gap-7 border-l'
            : isRightSidebarOpen
              ? 'w-[330px] px-7 py-8 gap-7 border-l opacity-100'
              : 'w-0 px-0 py-0 gap-0 border-l-0 opacity-0 overflow-hidden'
        }`}
      >
        {!isEmbedded && (
          <>
            <div className="flex-shrink-0">
              <h3 className="text-lg font-extrabold text-slate-800 mb-1">오늘 일정</h3>
              <p className="text-sm text-slate-400 font-medium mb-4">{selectedDate}</p>
              
              <div className="space-y-3 mb-4">
                 {filteredEvents.filter(e => e.date === selectedDate && !e.isMeeting).length === 0 ? (
                    <div className="py-6 px-4 bg-slate-50 border-l-4 border-slate-300 rounded-xl flex flex-col items-center justify-center text-center">
                      <p className="text-slate-500 font-bold mb-1">예정된 일정이 없습니다</p>
                    </div>
                 ) : (
                    filteredEvents.filter(e => e.date === selectedDate && !e.isMeeting).map(e => (
                       <div key={e.id} className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 shadow-sm">
                          <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: e.backgroundColor }} />
                          <span className="font-bold text-[13px] text-slate-700">{e.title}</span>
                       </div>
                    ))
                 )}
              </div>
              
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full text-slate-400 text-xs font-bold hover:text-indigo-500 transition py-2 bg-slate-50 rounded-lg hover:bg-indigo-50"
              >
                일정을 추가해보세요!
              </button>
            </div>

            <div className="flex-shrink-0">
              <h3 className="text-lg font-extrabold text-slate-800 mb-6">이번 주 회의</h3>
              <div className="space-y-3">
                {filteredEvents.filter(e => e.isMeeting).sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 4).map(meeting => (
                  <div key={meeting.id} onClick={() => onOpenReport?.(meeting.id)} className="flex justify-between items-start group cursor-pointer hover:bg-slate-50 p-3 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex gap-3">
                      <CheckCircle2 className="text-emerald-500 mt-0.5" size={18} />
                      <div>
                        <p className="font-bold text-slate-800 text-[14px] group-hover:text-emerald-600 transition-colors">
                          {meeting.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{meeting.date}</p>
                      </div>
                    </div>
                    <button className="bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-bold px-2.5 py-1.5 rounded-md hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-colors">
                      회의록 보기
                    </button>
                  </div>
                ))}
                {filteredEvents.filter(e => e.isMeeting).length === 0 && (
                   <div className="text-slate-400 text-sm py-2 text-center">진행된 회의가 없습니다.</div>
                )}
              </div>
            </div>
          </>
        )}

        <div className={`rounded-3xl border border-dashed border-slate-200 p-6 flex flex-col ${isEmbedded ? 'flex-1 bg-slate-50/50' : 'flex-shrink-0 min-h-[180px] mt-auto justify-center'}`}>
          {pinnedEvents.length === 0 ? (
            <div className={`flex ${isEmbedded ? 'flex-col items-center justify-center h-full gap-6 text-center' : 'items-center gap-5'}`}>
              <div className={`flex gap-1.5 ${isEmbedded ? 'flex-row' : 'flex-col'}`}>
                <Pin className="text-slate-300 fill-slate-300 -rotate-45" size={isEmbedded ? 24 : 20} />
                <Pin className="text-slate-200 fill-slate-200 -rotate-45" size={isEmbedded ? 24 : 20} />
                <Pin className="text-slate-100 fill-slate-100 -rotate-45" size={isEmbedded ? 24 : 20} />
              </div>
              <div className={isEmbedded ? '' : 'pl-5 border-l border-slate-200'}>
                <p className="text-slate-700 font-bold mb-1">중요 일정 핀 고정</p>
                <p className="text-slate-400 font-medium text-[12px] leading-relaxed">
                  일정을 드래그해서 <br /> 이곳에 꽂아두세요
                </p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col h-full justify-start">
              <div className="flex items-center gap-2 mb-5">
                <Pin className="text-rose-500 fill-rose-500 -rotate-45" size={16} />
                <p className="text-slate-800 font-extrabold text-[15px]">고정된 주요 일정</p>
              </div>
              <div className="space-y-3">
                {pinnedEvents.map(ev => {
                  const dateObj = new Date(ev.date);
                  return (
                    <div key={ev.id} className="group flex items-center justify-between p-3.5 bg-white border border-slate-100 hover:border-rose-200 hover:shadow-md rounded-2xl transition-all">
                      <div className="flex items-center gap-4 truncate">
                        <div className="w-11 h-11 bg-rose-50 rounded-xl flex flex-col items-center justify-center text-rose-600 flex-shrink-0 border border-rose-100/50">
                          <span className="text-[9px] font-black tracking-wider opacity-80">
                            {dateObj.getMonth() + 1}월
                          </span>
                          <span className="text-[16px] font-black leading-none">
                            {dateObj.getDate()}
                          </span>
                        </div>
                        <div className="truncate pr-2">
                          <p className="text-[13px] font-bold text-slate-800 truncate mb-0.5">
                            {ev.title}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400">14:00 - 15:30</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeletePinnedEvent(ev.id)}
                        className="p-2 hover:bg-rose-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pin size={14} className="text-rose-400 fill-rose-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center z-50">
          <div className="bg-white w-[880px] h-[680px] rounded-[32px] shadow-2xl flex flex-col overflow-hidden">
            <div className="p-10 flex-1 overflow-y-auto">
              <div className="flex items-center gap-3 text-slate-400 mb-3">
                <button
                  className="hover:text-indigo-600 transition-colors bg-slate-50 p-1.5 rounded-lg"
                  onClick={() => setIsModalOpen(false)}
                >
                  &lt;
                </button>
                <h2 className="text-[15px] font-bold text-slate-500 uppercase tracking-widest">
                  {selYear}년 {selMonth}월
                </h2>
              </div>

              <h3 className="text-3xl font-black text-slate-800 mb-8 tracking-tight">
                {selDay}일 <span className="text-slate-300 font-medium">선택됨</span>
              </h3>

              <div className="flex gap-10 h-full">
                <div className="flex-1 bg-white border border-slate-200 rounded-[24px] p-8 space-y-7 shadow-sm">
                  <div className="border-b border-slate-100 pb-3">
                    <input
                      type="text"
                      placeholder="새로운 일정 제목을 입력하세요"
                      className="w-full text-xl font-black text-slate-800 placeholder:text-slate-300 outline-none"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-6 text-[14px] text-slate-600 font-bold">
                    <div className="flex items-center gap-5">
                      <MapPin className="text-rose-400 w-5 h-5" />
                      <select
                        className="flex-1 text-[14px] font-bold text-slate-700 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl p-3 outline-none cursor-pointer transition-colors"
                        value={selectedChannel}
                        onChange={e => setSelectedChannel(e.target.value)}
                      >
                        <option value="" disabled>채널을 선택해주세요</option>
                        {Object.keys(channelColors)
                          .filter(ch => calendarMode === 'team' ? ch !== '개인 (Private)' : true)
                          .map(ch => (
                            <option key={ch} value={ch}>{ch}</option>
                          ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-5">
                      <User className="text-indigo-500 w-5 h-5" />
                      <span className="text-xs font-black text-slate-400">+ 3명</span>
                      <button className="w-8 h-8 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50 transition-all ml-2">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-start gap-5">
                      <Clock className="text-amber-500 w-5 h-5 mt-2" />
                      <div className="flex-1 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <p className="text-slate-800 font-black mb-4">시간 설정</p>
                        <div className="flex items-center justify-between relative">
                          <div className="relative flex-1">
                            <button
                              onClick={() => {
                                setIsStartOpen(!isStartOpen);
                                setIsEndOpen(false);
                              }}
                              className="w-full bg-white border border-slate-200 text-indigo-600 text-[15px] font-black hover:border-indigo-300 px-4 py-3 rounded-xl transition-all shadow-sm"
                            >
                              {startTime}
                            </button>
                            {isStartOpen && (
                              <div className="absolute top-full left-0 mt-2 w-full h-48 overflow-y-auto bg-white border border-slate-200 shadow-2xl rounded-xl z-50 custom-scrollbar">
                                {timeOptions.map((t, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setStartTime(t);
                                      setIsStartOpen(false);
                                    }}
                                    className="py-2.5 px-4 font-bold hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                  >
                                    {t}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <ArrowRight className="text-slate-300 w-5 h-5 mx-4" />

                          <div className="relative flex-1">
                            <button
                              onClick={() => {
                                setIsEndOpen(!isEndOpen);
                                setIsStartOpen(false);
                              }}
                              className="w-full bg-white border border-slate-200 text-indigo-600 text-[15px] font-black hover:border-indigo-300 px-4 py-3 rounded-xl transition-all shadow-sm"
                            >
                              {endTime}
                            </button>
                            {isEndOpen && (
                              <div className="absolute top-full left-0 mt-2 w-full h-48 overflow-y-auto bg-white border border-slate-200 shadow-2xl rounded-xl z-50 custom-scrollbar">
                                {timeOptions.map((t, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      setEndTime(t);
                                      setIsEndOpen(false);
                                    }}
                                    className="py-2.5 px-4 font-bold hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                                  >
                                    {t}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 pt-2">
                      <Bell className="text-slate-400 w-5 h-5" />
                      <span className="text-slate-700">리마인드 10분전</span>
                    </div>

                    <div className="flex items-center gap-5">
                      <Paperclip className="text-slate-400 w-5 h-5" />
                      <span className="text-slate-700">첨부파일 추가</span>
                    </div>

                    <div className="flex items-center gap-5 pb-2">
                      <Repeat className="text-slate-400 w-5 h-5" />
                      <span className="text-slate-700">반복 일정 설정 안함</span>
                    </div>
                  </div>
                </div>

                <div className="w-[200px] flex flex-col gap-5">
                  <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-[24px] bg-slate-50 p-6 text-center cursor-pointer transition-all group">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Paperclip className="text-indigo-500 w-5 h-5" />
                    </div>
                    <p className="text-[13px] font-bold text-slate-600 leading-relaxed mb-1">
                      회의 자료 업로드
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">최대 50MB</p>
                  </div>

                  <div className="h-32 bg-yellow-50 rounded-[24px] p-5 relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow">
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-200" />
                    <p className="text-yellow-800 text-[13px] font-bold">간단 메모</p>
                    <p className="text-yellow-600/70 text-[11px] font-medium mt-2">
                      이 일정에 대한 <br />간단한 메모를 남겨보세요.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border-t border-slate-200 p-6 flex justify-end gap-3 rounded-b-[32px]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-7 py-3 bg-white border border-slate-200 text-slate-600 font-black text-[14px] rounded-xl hover:bg-slate-100 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveEvent}
                className="px-8 py-3 bg-indigo-600 text-white font-black text-[14px] rounded-xl shadow-md hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                일정 등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
