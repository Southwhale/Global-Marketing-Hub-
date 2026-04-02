import React from 'react';
import { 
  Search, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare, 
  Lock, 
  Plus, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { SupportTicket } from '../types';

const FAQS = [
  {
    question: "KPI 트래커에서 목표값은 어떻게 설정하나요?",
    answer: "KPI 상세 페이지에서 각 분기별(Q1-Q4) 목표값을 직접 입력할 수 있습니다. 입력된 목표값은 대시보드의 달성률 차트에 즉시 반영됩니다."
  },
  {
    question: "지역별 비용(Regional Cost)은 어디서 확인하나요?",
    answer: "KPI 상세 페이지의 'Regional Cost Breakdown' 섹션에서 확인할 수 있습니다. 편집 모드에서는 글로벌 지역 목록을 직접 관리(추가, 수정, 삭제)하거나 특정 KPI에 필요한 지역만 선택하여 비용을 입력할 수 있습니다."
  },
  {
    question: "다크모드 설정은 어떻게 하나요?",
    answer: "설정(Settings) 메뉴의 'General Settings' 섹션에서 테마를 라이트 모드 또는 다크 모드로 전환할 수 있습니다."
  },
  {
    question: "데이터가 실시간으로 동기화되나요?",
    answer: "네, 본 서비스는 Firebase Firestore를 사용하여 모든 데이터 변경사항이 팀원 간에 실시간으로 동기화됩니다."
  },
  {
    question: "CRM 연동은 어떻게 하나요?",
    answer: "설정 메뉴의 'CRM & Power BI Integration' 섹션에서 Microsoft Dynamics 365 연동 버튼을 클릭하여 진행할 수 있습니다."
  }
];

export const Support = () => {
  const { user, supportTickets, addSupportTicket, addSupportReply } = useStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [openFaqIndex, setOpenFaqIndex] = React.useState<number | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = React.useState(false);
  const [newTicket, setNewTicket] = React.useState({ subject: '', message: '', isPrivate: true });
  const [selectedTicketId, setSelectedTicketId] = React.useState<string | null>(null);
  const [replyMessage, setReplyMessage] = React.useState('');

  const filteredFaqs = FAQS.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const myTickets = supportTickets.filter(t => t.userId === user?.uid);
  const publicTickets = supportTickets.filter(t => !t.isPrivate && t.userId !== user?.uid);
  
  const selectedTicket = supportTickets.find(t => t.id === selectedTicketId);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.message) return;
    await addSupportTicket(newTicket);
    setNewTicket({ subject: '', message: '', isPrivate: true });
    setIsNewTicketModalOpen(false);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyMessage) return;
    await addSupportReply(selectedTicketId, replyMessage, false);
    setReplyMessage('');
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-20">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Support Center</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
          도움이 필요하신가요? 자주 묻는 질문을 확인하거나 1:1 문의를 남겨주세요. 
          비공개 문의는 관리자만 확인할 수 있습니다.
        </p>
      </div>

      {/* FAQ Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">자주 묻는 질문 (FAQ)</h2>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="검색어 입력..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredFaqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-all"
            >
              <button 
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <span className="font-bold text-slate-900 dark:text-white">{faq.question}</span>
                {openFaqIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </button>
              {openFaqIndex === index && (
                <div className="px-6 pb-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Inquiry Board Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">1:1 문의 게시판</h2>
          </div>
          <button 
            onClick={() => setIsNewTicketModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            새 문의 작성
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">나의 문의 내역</h3>
            <div className="space-y-3">
              {myTickets.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-400">작성한 문의가 없습니다.</p>
                </div>
              ) : (
                myTickets.map(ticket => (
                  <button 
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className={cn(
                      "w-full p-4 text-left rounded-2xl border transition-all",
                      selectedTicketId === ticket.id 
                        ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-lg shadow-emerald-500/10" 
                        : "bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                        ticket.status === 'resolved' ? "bg-emerald-100 text-emerald-700" :
                        ticket.status === 'in-progress' ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {ticket.status}
                      </span>
                      <span className="text-[10px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white truncate mb-1">{ticket.subject}</h4>
                    <div className="flex items-center gap-2">
                      {ticket.isPrivate && <Lock className="w-3 h-3 text-slate-400" />}
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{ticket.message}</p>
                    </div>
                  </button>
                ))
              )}
            </div>

            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider pt-4">공개 문의</h3>
            <div className="space-y-3">
              {publicTickets.map(ticket => (
                <button 
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={cn(
                    "w-full p-4 text-left rounded-2xl border transition-all",
                    selectedTicketId === ticket.id 
                      ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-lg shadow-emerald-500/10" 
                      : "bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-400 font-bold">{ticket.userName}</span>
                    <span className="text-[10px] text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white truncate">{ticket.subject}</h4>
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Detail */}
          <div className="lg:col-span-2">
            {selectedTicket ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
                {/* Detail Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                        <p className="text-xs text-slate-500">{selectedTicket.userName} • {new Date(selectedTicket.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    {selectedTicket.isPrivate && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-[10px] font-bold text-slate-500">
                        <Lock className="w-3 h-3" />
                        PRIVATE
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {selectedTicket.message}
                  </div>
                </div>

                {/* Replies */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {(!selectedTicket.replies || selectedTicket.replies.length === 0) ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                      <Clock className="w-8 h-8 opacity-20" />
                      <p className="text-sm">답변을 기다리고 있습니다.</p>
                    </div>
                  ) : (
                    selectedTicket.replies.map(reply => (
                      <div 
                        key={reply.id}
                        className={cn(
                          "flex gap-4",
                          reply.isAdmin ? "flex-row-reverse" : ""
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          reply.isAdmin ? "bg-blue-100 dark:bg-blue-900/30" : "bg-slate-100 dark:bg-slate-700"
                        )}>
                          {reply.isAdmin ? <ShieldCheck className="w-4 h-4 text-blue-600" /> : <UserIcon className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div className={cn(
                          "max-w-[80%] space-y-1",
                          reply.isAdmin ? "items-end" : ""
                        )}>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-500">{reply.author}</span>
                            <span className="text-[10px] text-slate-400">{new Date(reply.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className={cn(
                            "p-3 rounded-2xl text-sm",
                            reply.isAdmin 
                              ? "bg-blue-600 text-white rounded-tr-none" 
                              : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-none"
                          )}>
                            {reply.message}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Reply Input */}
                <form 
                  onSubmit={handleSendReply}
                  className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50"
                >
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="답변을 입력하세요..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="w-full pl-4 pr-12 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                    <button 
                      type="submit"
                      disabled={!replyMessage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 h-[600px] flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <p className="font-bold">문의 내역을 선택하여 상세 내용을 확인하세요.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* New Ticket Modal */}
      {isNewTicketModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">새 문의 작성</h3>
              <button 
                onClick={() => setIsNewTicketModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">제목</label>
                <input 
                  type="text"
                  required
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  placeholder="문의 제목을 입력하세요"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">내용</label>
                <textarea 
                  required
                  rows={5}
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  placeholder="문의 내용을 상세히 적어주세요"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all resize-none"
                />
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">비공개 문의</p>
                    <p className="text-[10px] text-slate-500">관리자와 본인만 확인할 수 있습니다.</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => setNewTicket({ ...newTicket, isPrivate: !newTicket.isPrivate })}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors duration-200",
                    newTicket.isPrivate ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200",
                    newTicket.isPrivate ? "right-1" : "left-1"
                  )} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsNewTicketModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                >
                  취소
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all"
                >
                  작성 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
