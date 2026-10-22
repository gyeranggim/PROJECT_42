'use client';

import React, { forwardRef } from 'react';

export interface LeaveDocumentPreviewProps {
  userName: string;
  department: string;
  email: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  signatureDataUrl?: string | null;
  applicationDate?: string;
  status?: '대기' | '승인' | '반려';
  rejectReason?: string | null;
}

export const LeaveDocumentPreview = forwardRef<HTMLDivElement, LeaveDocumentPreviewProps>(
  function LeaveDocumentPreview(
    {
      userName,
      department,
      email,
      startDate,
      endDate,
      leaveType,
      reason,
      signatureDataUrl,
      applicationDate,
      status = '대기',
      rejectReason,
    },
    ref
  ) {
    // 일수 계산
    const calculateDays = () => {
      if (!startDate) return 0;
      if (leaveType === '오전반차' || leaveType === '오후반차') {
        return 0.5;
      }
      if (!endDate || startDate === endDate) {
        return 1;
      }
      try {
        const s = new Date(startDate);
        const e = new Date(endDate);
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return isNaN(diffDays) ? 1 : diffDays;
      } catch {
        return 1;
      }
    };

    const daysCount = calculateDays();
    const today = applicationDate || new Date().toISOString().split('T')[0];
    const [year, month, day] = today.split('-');

    return (
      <div
        ref={ref}
        id="leave-document-print-area"
        className="mx-auto w-full max-w-[500px] bg-white p-7 text-[#1E3932] shadow-md border border-stone-200 rounded-[8px] font-sans text-xs leading-relaxed"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
          color: '#1E3932',
        }}
      >
        {/* 문서 타이틀 및 결재란 */}
        <div className="flex items-center justify-between border-b-2 border-[#1E3932] pb-3 mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-extrabold tracking-wider text-[#1E3932]">
              연 차 휴 가 신 청 서
            </h1>
            <p className="text-[10px] text-stone-500 mt-0.5">ANNUAL LEAVE APPLICATION</p>
          </div>

          {/* 결재선 */}
          <table className="border-collapse border border-stone-300 text-[10px] text-center w-28">
            <tbody>
              <tr className="bg-stone-50">
                <th className="border border-stone-300 py-1 font-semibold text-stone-700 w-14">
                  신청 (기안)
                </th>
                <th className="border border-stone-300 py-1 font-semibold text-stone-700 w-14">
                  승인 (팀장)
                </th>
              </tr>
              <tr className="h-10">
                <td className="border border-stone-300 relative p-1">
                  {signatureDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={signatureDataUrl}
                      alt="신청자 서명"
                      className="max-h-8 max-w-full mx-auto object-contain"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[9px] text-[#1E3932]">
                      <span className="font-bold">{userName || '신청인'}</span>
                      <span className="text-[8px] text-stone-400">(전자서명)</span>
                    </div>
                  )}
                </td>
                <td className="border border-stone-300 relative p-1 h-11">
                  {status === '승인' ? (
                    <div className="flex flex-col items-center justify-center py-0.5">
                      <div className="w-8 h-8 rounded-full border-2 border-rose-600 flex flex-col items-center justify-center text-rose-600 font-bold leading-none select-none bg-rose-50/40 shadow-xs">
                        <span className="text-[6.5px] tracking-tight">팀장</span>
                        <span className="text-[9px] tracking-normal font-extrabold">승인</span>
                      </div>
                      <span className="text-[7.5px] text-stone-400 font-mono scale-90 mt-0.5">
                        {today.replace(/-/g, '.')}
                      </span>
                    </div>
                  ) : status === '반려' ? (
                    <div className="flex flex-col items-center justify-center py-0.5">
                      <div className="w-8 h-8 rounded-full border border-stone-400 flex flex-col items-center justify-center text-stone-500 font-bold leading-none select-none">
                        <span className="text-[6.5px] tracking-tight">팀장</span>
                        <span className="text-[8.5px] tracking-normal font-bold">반려</span>
                      </div>
                      <span className="text-[7.5px] text-stone-400 font-mono scale-90 mt-0.5">
                        {today.replace(/-/g, '.')}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[9px] text-stone-300">결재 대기</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 1. 신청인 인적사항 */}
        <div className="mb-4">
          <div className="text-[11px] font-bold text-[#00754A] mb-1.5 flex items-center gap-1">
            <span>■ 1. 신청인 정보</span>
          </div>
          <table className="w-full border-collapse border border-stone-300 text-left">
            <tbody>
              <tr className="border-b border-stone-300">
                <th className="w-24 bg-stone-50 px-3 py-1.5 font-semibold text-stone-700 border-r border-stone-300">
                  성 명
                </th>
                <td className="px-3 py-1.5 font-bold text-stone-900 border-r border-stone-300">
                  {userName || '(미입력)'}
                </td>
                <th className="w-24 bg-stone-50 px-3 py-1.5 font-semibold text-stone-700 border-r border-stone-300">
                  소속 부서
                </th>
                <td className="px-3 py-1.5 text-stone-900">{department || '(미입력)'}</td>
              </tr>
              <tr>
                <th className="bg-stone-50 px-3 py-1.5 font-semibold text-stone-700 border-r border-stone-300">
                  이메일 계정
                </th>
                <td colSpan={3} className="px-3 py-1.5 text-stone-700">
                  {email || '(미입력)'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. 휴가 신청 내용 */}
        <div className="mb-5">
          <div className="text-[11px] font-bold text-[#00754A] mb-1.5 flex items-center gap-1">
            <span>■ 2. 휴가 신청 내용</span>
          </div>
          <table className="w-full border-collapse border border-stone-300 text-left">
            <tbody>
              <tr className="border-b border-stone-300">
                <th className="w-24 bg-stone-50 px-3 py-1.5 font-semibold text-stone-700 border-r border-stone-300">
                  휴가 구분
                </th>
                <td className="px-3 py-1.5 font-semibold text-[#00754A] border-r border-stone-300">
                  {leaveType || '종일'}
                </td>
                <th className="w-24 bg-stone-50 px-3 py-1.5 font-semibold text-stone-700 border-r border-stone-300">
                  신청 일수
                </th>
                <td className="px-3 py-1.5 font-bold text-stone-900">{daysCount} 일간</td>
              </tr>
              <tr className="border-b border-stone-300">
                <th className="bg-stone-50 px-3 py-1.5 font-semibold text-stone-700 border-r border-stone-300">
                  휴가 기간
                </th>
                <td colSpan={3} className="px-3 py-1.5 font-bold text-stone-900">
                  {startDate ? startDate : 'YYYY-MM-DD'} ~{' '}
                  {leaveType.includes('반차') ? startDate : endDate || 'YYYY-MM-DD'}
                </td>
              </tr>
              <tr>
                <th className="bg-stone-50 px-3 py-3 font-semibold text-stone-700 border-r border-stone-300 align-top">
                  신청 사유
                </th>
                <td colSpan={3} className="px-3 py-3 text-stone-800 min-h-[50px] whitespace-pre-wrap">
                  {reason || '(사유를 입력해 주세요)'}
                </td>
              </tr>
              {rejectReason && (
                <tr className="border-t border-rose-200 bg-rose-50/50">
                  <th className="bg-rose-50 px-3 py-2 font-semibold text-rose-700 border-r border-rose-200 align-top">
                    반려 사유
                  </th>
                  <td colSpan={3} className="px-3 py-2 text-rose-800 text-xs whitespace-pre-wrap">
                    {rejectReason}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 서약 문구 */}
        <div className="my-6 text-center text-stone-700 text-[11px] leading-relaxed">
          <p>근로기준법 및 사내 취업규칙에 의거하여</p>
          <p>위와 같이 연차유급휴가를 신청하오니 허가하여 주시기 바랍니다.</p>
        </div>

        {/* 작성일 및 서명자 확인 */}
        <div className="mt-6 text-center border-t border-stone-200 pt-4">
          <div className="text-xs font-semibold text-stone-700 mb-3 tracking-wider">
            {year}년 {month}월 {day}일
          </div>
          <div className="flex items-center justify-end gap-3 pr-4 text-xs">
            <span className="text-stone-700 font-medium">신청인:</span>
            <span className="font-bold text-stone-900">{userName || email}</span>
            <span className="text-stone-500">(서명 또는 인)</span>
            <div className="inline-flex items-center gap-1.5 border border-stone-200 rounded p-1 bg-white">
              {signatureDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={signatureDataUrl} alt="서명" className="h-7 w-20 object-contain" />
              ) : (
                <span className="text-xs font-bold text-stone-700 px-2">{userName}</span>
              )}
              <div className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-rose-600 text-rose-600 text-[8px] font-bold">
                직인
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
export default LeaveDocumentPreview;
