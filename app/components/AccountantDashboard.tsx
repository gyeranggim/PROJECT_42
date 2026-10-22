'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Mail,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  Send,
  Building,
  User,
  Calendar,
  AlertCircle,
  Eye,
  Check,
  RefreshCw,
  Printer,
  X,
} from 'lucide-react';

import LeaveDocumentPreview from '@/app/components/LeaveDocumentPreview';

export interface MemberRecord {
  email: string;
  이름?: string | null;
  부서?: string | null;
  역할?: string | null;
  hire_date?: string | null;
}

export interface LeaveRequestRecord {
  id: string;
  email: string;
  user_name?: string | null;
  department?: string | null;
  start_date: string;
  end_date: string;
  reason: string;
  status: '대기' | '승인' | '반려';
  created_at: string;
  reject_reason?: string | null;
  pdf_url?: string | null;
  leave_type?: string | null;
  signature_data?: string | null;
}

interface AccountantDashboardProps {
  members: MemberRecord[];
  requests: LeaveRequestRecord[];
  onRefresh: () => void;
}

export default function AccountantDashboard({
  members,
  requests,
  onRefresh,
}: AccountantDashboardProps) {
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'leave_calc' | 'all_documents'>('leave_calc');
  const [previewDoc, setPreviewDoc] = useState<LeaveRequestRecord | null>(null);

  // 연차촉진 모달 상태
  const [promotionModalMember, setPromotionModalMember] = useState<{
    member: MemberRecord;
    totalLeave: number;
    usedLeave: number;
    remainingLeave: number;
  } | null>(null);

  const [promotionSending, setPromotionSending] = useState(false);
  const [promotionSuccessMsg, setPromotionSuccessMsg] = useState('');
  const [promotionErrorMsg, setPromotionErrorMsg] = useState('');

  // 1. 부서 목록 추출
  const departmentList = useMemo(() => {
    const set = new Set<string>();
    members.forEach((m) => {
      if (m.부서) set.add(m.부서);
    });
    return Array.from(set);
  }, [members]);

  // 2. 근로기준법 기반 연차 계산 로직
  // - 입사 1년 미만: 1개월 개근 시 1일씩 (최대 11일)
  // - 입사 1년 이상: 기본 15일 + 2년마다 1일 가산 (15 + floor((근속연수 - 1)/2), 최대 25일)
  const calculateAnnualLeave = (hireDateStr?: string | null) => {
    if (!hireDateStr) return 15; // 기본값 15일
    try {
      const hireDate = new Date(hireDateStr);
      const now = new Date();
      const diffYears = (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      if (diffYears < 1) {
        // 입사 1년 미만: 근무 개월 수에 비례 (최대 11일)
        const diffMonths = Math.floor(
          (now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4)
        );
        return Math.min(11, Math.max(1, diffMonths));
      } else {
        // 1년 이상
        const completedYears = Math.floor(diffYears);
        const additionalDays = Math.floor((completedYears - 1) / 2);
        return Math.min(25, 15 + Math.max(0, additionalDays));
      }
    } catch {
      return 15;
    }
  };

  // 사원별 연차 사용 및 잔여 통계 산출
  const memberLeaveStats = useMemo(() => {
    return members.map((member) => {
      const totalLeave = calculateAnnualLeave(member.hire_date);

      // 해당 사원의 승인된 연차 일수 계산
      const approvedRequests = requests.filter(
        (r) => r.email === member.email && r.status === '승인'
      );

      let usedLeave = 0;
      approvedRequests.forEach((r) => {
        if (r.leave_type === '오전반차' || r.leave_type === '오후반차') {
          usedLeave += 0.5;
        } else {
          try {
            const s = new Date(r.start_date);
            const e = new Date(r.end_date);
            const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            usedLeave += isNaN(diffDays) ? 1 : diffDays;
          } catch {
            usedLeave += 1;
          }
        }
      });

      const remainingLeave = Math.max(0, totalLeave - usedLeave);

      return {
        member,
        totalLeave,
        usedLeave,
        remainingLeave,
        approvedCount: approvedRequests.length,
      };
    });
  }, [members, requests]);

  // 필터링 적용된 사원 통계 목록
  const filteredMemberStats = useMemo(() => {
    return memberLeaveStats.filter((item) => {
      if (selectedDept !== 'all' && item.member.부서 !== selectedDept) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const nameMatch = (item.member.이름 || '').toLowerCase().includes(query);
        const emailMatch = item.member.email.toLowerCase().includes(query);
        const deptMatch = (item.member.부서 || '').toLowerCase().includes(query);
        return nameMatch || emailMatch || deptMatch;
      }
      return true;
    });
  }, [memberLeaveStats, selectedDept, searchTerm]);

  // 대시보드 전체 카운트 지표
  const dashboardMetrics = useMemo(() => {
    const totalRequests = requests.length;
    const approvedCount = requests.filter((r) => r.status === '승인').length;
    const pendingCount = requests.filter((r) => r.status === '대기').length;
    const rejectedCount = requests.filter((r) => r.status === '반려').length;
    const pdfCount = requests.filter((r) => !!r.pdf_url).length;

    let totalUsedDays = 0;
    requests
      .filter((r) => r.status === '승인')
      .forEach((r) => {
        if (r.leave_type === '오전반차' || r.leave_type === '오후반차') {
          totalUsedDays += 0.5;
        } else {
          try {
            const s = new Date(r.start_date);
            const e = new Date(r.end_date);
            const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            totalUsedDays += isNaN(diffDays) ? 1 : diffDays;
          } catch {
            totalUsedDays += 1;
          }
        }
      });

    return {
      totalRequests,
      approvedCount,
      pendingCount,
      rejectedCount,
      pdfCount,
      totalUsedDays,
    };
  }, [requests]);

  // 연차촉진 메일 발송 처리
  const handleSendPromotionEmail = async () => {
    if (!promotionModalMember) return;
    setPromotionSending(true);
    setPromotionErrorMsg('');
    setPromotionSuccessMsg('');

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: promotionModalMember.member.email,
          type: 'promotion',
          data: {
            userName: promotionModalMember.member.이름 || promotionModalMember.member.email,
            department: promotionModalMember.member.부서 || '전체',
            hireDate: promotionModalMember.member.hire_date || '기록 없음',
            totalLeave: promotionModalMember.totalLeave,
            usedLeave: promotionModalMember.usedLeave,
            remainingLeave: promotionModalMember.remainingLeave,
            deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || '메일 발송에 실패했습니다.');
      }

      setPromotionSuccessMsg(
        `${promotionModalMember.member.이름 || promotionModalMember.member.email}님께 연차촉진 통보 메일이 성공적으로 발송되었습니다.`
      );
      setTimeout(() => {
        setPromotionModalMember(null);
        setPromotionSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setPromotionErrorMsg(err.message || '발송 중 오류가 발생했습니다.');
    } finally {
      setPromotionSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1) 대시보드 타이틀 & 액션 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3932] text-white text-xs font-bold mb-2">
            <Building className="h-3 w-3" />
            경리/인사 관리자 전용
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E3932]">
            전사 연차 대시보드 & 잔여 연차 관리
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            전사 임직원의 발생 연차, 기사용 연차, 잔여 연차를 자동 계산하고 법정 연차촉진을 시행합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="btn-pill flex items-center justify-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-800 shadow-sm transition hover:bg-stone-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>데이터 새로고침</span>
        </button>
      </div>

      {/* 2) 4개 요약 통계 메트릭 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 카드 1: 보관된 총 신청서 */}
        <div className="rounded-[12px] bg-white p-5 border border-[#edebe9] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>보관된 연차신청서</span>
            <FileText className="h-4 w-4 text-[#00754A]" />
          </div>
          <div className="text-3xl font-extrabold text-stone-900 mt-2">
            {dashboardMetrics.pdfCount}
            <span className="text-sm font-normal text-stone-500 ml-1">
              / {dashboardMetrics.totalRequests}건
            </span>
          </div>
          <div className="text-[11px] text-[#00754A] font-semibold mt-1">
            Storage(leave-documents) 보관
          </div>
        </div>

        {/* 카드 2: 총 사용 연차 일수 */}
        <div className="rounded-[12px] bg-white p-5 border border-[#edebe9] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>전사 총 사용 연차</span>
            <Calendar className="h-4 w-4 text-[#1E3932]" />
          </div>
          <div className="text-3xl font-extrabold text-stone-900 mt-2">
            {dashboardMetrics.totalUsedDays}
            <span className="text-sm font-normal text-stone-500 ml-1">일</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            승인된 휴가 합산 (반차 0.5일 반영)
          </div>
        </div>

        {/* 카드 3: 승인 완료 건수 */}
        <div className="rounded-[12px] bg-white p-5 border border-[#edebe9] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>승인 완료 건수</span>
            <CheckCircle2 className="h-4 w-4 text-[#00754A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#00754A] mt-2">
            {dashboardMetrics.approvedCount}
            <span className="text-sm font-normal text-stone-500 ml-1">건</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            결재 완료율: {dashboardMetrics.totalRequests > 0 ? Math.round((dashboardMetrics.approvedCount / dashboardMetrics.totalRequests) * 100) : 0}%
          </div>
        </div>

        {/* 카드 4: 처리 대기 건수 */}
        <div className="rounded-[12px] bg-white p-5 border border-[#edebe9] shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500">
            <span>팀장 결재 대기</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 mt-2">
            {dashboardMetrics.pendingCount}
            <span className="text-sm font-normal text-stone-500 ml-1">건</span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">반려 건수: {dashboardMetrics.rejectedCount}건</div>
        </div>
      </div>

      {/* 3) 탭 전환: 사원별 잔여 연차 계산표 vs 전체 연차신청서 보관함 */}
      <div className="border-b border-stone-200 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('leave_calc')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'leave_calc'
                ? 'text-[#00754A]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            사원별 연차 현황 및 잔여 연차 계산
            {activeTab === 'leave_calc' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00754A] rounded-full" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all_documents')}
            className={`pb-3 text-sm font-bold transition-all relative ${
              activeTab === 'all_documents'
                ? 'text-[#00754A]'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            전체 연차신청서(PDF) 보관함
            {activeTab === 'all_documents' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00754A] rounded-full" />
            )}
          </button>
        </div>

        {/* 필터 & 검색 컨트롤 */}
        <div className="pb-2 hidden sm:flex items-center gap-2">
          {/* 부서 선택 */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              aria-label="부서 선택"
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 outline-none focus:border-[#00754A]"
            >
              <option value="all">전체 부서</option>
              {departmentList.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* 검색창 */}
          <div className="relative">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="사원명 / 이메일 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-full border border-stone-300 bg-white pl-8 pr-3 py-1.5 text-xs text-stone-800 outline-none focus:border-[#00754A] w-44"
            />
          </div>
        </div>
      </div>

      {/* 4) 탭 1: 사원별 잔여 연차 현황 및 연차촉진 */}
      {activeTab === 'leave_calc' && (
        <div className="rounded-[12px] bg-white border border-[#edebe9] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-200 bg-stone-50/50 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-bold text-stone-700">
              총 임직원: <span className="text-[#00754A]">{filteredMemberStats.length}</span>명
            </div>
            <div className="text-[11px] text-stone-500">
              * 근로기준법 제60조(연차유급휴가) 및 제61조(연차유급휴가의 사용촉진) 기준 자동 계산
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#faf6ee] text-[#1E3932] font-bold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">사원 정보</th>
                  <th className="py-3 px-4">소속 부서</th>
                  <th className="py-3 px-4">입사일</th>
                  <th className="py-3 px-4 text-center">총 발생 연차</th>
                  <th className="py-3 px-4 text-center">사용 연차</th>
                  <th className="py-3 px-4 text-center">잔여 연차</th>
                  <th className="py-3 px-4 text-center">연차촉진 조치</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMemberStats.map((item) => {
                  const hasRemaining = item.remainingLeave > 0;

                  return (
                    <tr key={item.member.email} className="hover:bg-stone-50/70 transition">
                      <td className="py-3.5 px-4 font-semibold text-stone-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#d4e9e2] text-[#1E3932] font-bold flex items-center justify-center text-xs">
                            {(item.member.이름 || item.member.email).charAt(0)}
                          </div>
                          <div>
                            <div>{item.member.이름 || '(이름 미등록)'}</div>
                            <div className="text-[11px] font-normal text-stone-400">
                              {item.member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium text-[11px]">
                          {item.member.부서 || '미배정'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-stone-600 font-mono text-[11px]">
                        {item.member.hire_date || '2023-01-01'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-stone-800">
                        {item.totalLeave}일
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-stone-600">
                        {item.usedLeave}일
                        <span className="text-[10px] text-stone-400 block font-normal">
                          ({item.approvedCount}건 승인)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                            item.remainingLeave > 5
                              ? 'bg-[#d4e9e2] text-[#00754A]'
                              : item.remainingLeave > 0
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {item.remainingLeave}일
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {hasRemaining ? (
                          <button
                            type="button"
                            onClick={() => setPromotionModalMember(item)}
                            className="btn-pill inline-flex items-center gap-1.5 rounded-full bg-[#1E3932] hover:bg-[#00754A] px-3 py-1.5 text-[11px] font-bold text-white transition active:scale-95 shadow-xs"
                          >
                            <Mail className="h-3 w-3" />
                            <span>촉진 메일 통보</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-stone-400 font-medium">
                            전액 소진 완료
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5) 탭 2: 전체 연차신청서(PDF) 보관함 */}
      {activeTab === 'all_documents' && (
        <div className="rounded-[12px] bg-white border border-[#edebe9] shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-200 bg-stone-50/50 flex items-center justify-between">
            <div className="text-xs font-bold text-stone-700">
              전체 연차신청 건수: <span className="text-[#00754A]">{requests.length}</span>건
            </div>
            <div className="text-[11px] text-stone-500">
              * Supabase Storage (leave-documents 버킷) 보관 파일 목록
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {requests.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                제출된 연차 신청서가 없습니다.
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/70 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-700 font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      <FileText className="h-5 w-5 text-[#00754A]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-[#1E3932]">
                          {req.user_name || req.email}
                        </span>
                        <span className="text-xs text-stone-500">· {req.department || '부서미지정'}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            req.status === '승인'
                              ? 'bg-[#d4e9e2] text-[#00754A]'
                              : req.status === '반려'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {req.status}
                        </span>
                        {req.leave_type && (
                          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[11px]">
                            {req.leave_type}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-600 mt-1">
                        <strong>기간:</strong> {req.start_date} ~ {req.end_date} |{' '}
                        <strong>사유:</strong> {req.reason}
                      </div>
                      {req.reject_reason && (
                        <div className="text-xs text-rose-700 mt-1 bg-rose-50 p-1.5 rounded">
                          <strong>반려 사유:</strong> {req.reject_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => setPreviewDoc(req)}
                      className="btn-pill flex items-center gap-1.5 rounded-full border border-stone-300 bg-white hover:bg-stone-50 px-3.5 py-2 text-xs font-bold text-stone-700 shadow-xs transition"
                      title="사원 서명 및 팀장 승인 도장이 날인된 정식 서식 열람"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#00754A]" />
                      <span>신청서 서식</span>
                    </button>
                    {req.pdf_url ? (
                      <a
                        href={`${req.pdf_url}?t=${Date.now()}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-pill flex items-center gap-1.5 rounded-full bg-[#00754A] hover:bg-[#006241] px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>PDF 열람</span>
                      </a>
                    ) : (
                      <span className="text-xs text-stone-400 bg-stone-100 px-3 py-1.5 rounded-full">
                        PDF 미생성
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 6) 표준 연차촉진 모달 (Annual Leave Promotion Modal) */}
      {promotionModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-[16px] bg-white p-6 sm:p-7 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-[#00754A]" />
                <h3 className="text-lg font-extrabold text-[#1E3932]">
                  미사용 연차유급휴가 사용 촉진 통보
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPromotionModalMember(null)}
                className="text-stone-400 hover:text-stone-700 transition"
              >
                ✕
              </button>
            </div>

            {/* 표준 통보서 미리보기 양식 */}
            <div className="bg-[#faf6ee] rounded-xl p-5 border border-stone-200 text-xs text-stone-800 space-y-3 leading-relaxed mb-5">
              <div className="font-bold text-sm text-[#1E3932] border-b border-stone-300 pb-2">
                [근로기준법 제61조 준수] 연차유급휴가 사용 촉진 통보서
              </div>
              <div>
                <strong>수신:</strong> {promotionModalMember.member.이름} 귀하 (
                {promotionModalMember.member.부서 || '소속부서'}, {promotionModalMember.member.email})
              </div>
              <div>
                귀하의 근로기준법 제60조에 따른 금년도 발생 연차유급휴가 중 현재까지 미사용된 휴가 일수를 다음과 같이 통보하오니, 통보를 받은 날로부터 10일 이내에 미사용 휴가의 사용 시기를 지정하여 통보하여 주시기 바랍니다.
              </div>

              {/* 통보 세부 내역 표 */}
              <table className="w-full border-collapse border border-stone-300 text-center text-xs bg-white my-2">
                <thead>
                  <tr className="bg-stone-100 text-stone-700">
                    <th className="border border-stone-300 py-1.5">입사일</th>
                    <th className="border border-stone-300 py-1.5">총 발생일수</th>
                    <th className="border border-stone-300 py-1.5">기 사용일수</th>
                    <th className="border border-stone-300 py-1.5 font-bold text-[#00754A]">
                      미사용(잔여)일수
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-stone-300 py-2">
                      {promotionModalMember.member.hire_date || '2023-01-01'}
                    </td>
                    <td className="border border-stone-300 py-2">
                      {promotionModalMember.totalLeave}일
                    </td>
                    <td className="border border-stone-300 py-2">
                      {promotionModalMember.usedLeave}일
                    </td>
                    <td className="border border-stone-300 py-2 font-bold text-[#00754A] text-sm">
                      {promotionModalMember.remainingLeave}일
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="text-[11px] text-stone-600 bg-white/70 p-2.5 rounded border border-stone-200">
                ※ 상기 기한 내에 사용 계획을 제출하지 않을 경우, 근로기준법 제61조에 따라 회사가 사용 시기를 지정하여 통보하게 되며, 기한 내 미사용 휴가에 대한 금전보상 청구권이 소멸됩니다.
              </div>
            </div>

            {/* 피드백 메시지 */}
            {promotionErrorMsg && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" />
                <span>{promotionErrorMsg}</span>
              </div>
            )}
            {promotionSuccessMsg && (
              <div className="p-3 mb-4 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                <span>{promotionSuccessMsg}</span>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPromotionModalMember(null)}
                className="btn-pill rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={promotionSending}
                onClick={handleSendPromotionEmail}
                className="btn-pill flex items-center gap-2 rounded-full bg-[#00754A] hover:bg-[#006241] px-5 py-2 text-xs font-bold text-white shadow-sm transition disabled:opacity-50 active:scale-95"
              >
                {promotionSending ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>발송 중...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>원클릭 촉진 메일 발송</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7) 경리담당자용 정식 연차유급휴가신청서 열람 모달 (사원 서명 + 팀장 승인 도장 완비) */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-[620px] max-h-[95vh] overflow-y-auto rounded-3xl bg-stone-100 p-5 shadow-2xl border border-stone-300">
            {/* 상단 타이틀 */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-300">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00754A]/10 text-[#00754A]">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#1E3932]">
                    연차유급휴가신청서 (최종 승인본)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    신청자: {previewDoc.user_name || previewDoc.email} | 결재상태: {previewDoc.status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 실제 정식 서식 (사원 서명 + 팀장 승인 도장 함께 표시) */}
            <div className="bg-white p-3 rounded-2xl shadow-inner border border-stone-300 flex justify-center">
              <LeaveDocumentPreview
                userName={previewDoc.user_name || previewDoc.email.split('@')[0]}
                department={previewDoc.department || '부서미지정'}
                email={previewDoc.email}
                startDate={previewDoc.start_date}
                endDate={previewDoc.end_date}
                leaveType={previewDoc.leave_type || '종일'}
                reason={previewDoc.reason}
                signatureDataUrl={previewDoc.signature_data || null}
                applicationDate={previewDoc.created_at.split('T')[0].split(' ')[0]}
                status={previewDoc.status}
                rejectReason={previewDoc.reject_reason}
              />
            </div>

            {/* 하단 액션 버튼 */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-stone-300">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-pill inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
              >
                <Printer className="h-3.5 w-3.5 text-stone-500" />
                <span>문서 인쇄</span>
              </button>
              <div className="flex gap-2">
                {previewDoc.pdf_url && (
                  <a
                    href={`${previewDoc.pdf_url}?t=${Date.now()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-pill inline-flex items-center gap-1.5 rounded-full bg-[#00754A] hover:bg-[#006241] px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>최종 PDF 다운로드</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="btn-pill rounded-full bg-stone-300 hover:bg-stone-400 px-5 py-2 text-xs font-bold text-stone-800 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
