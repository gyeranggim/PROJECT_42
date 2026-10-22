'use client';

import React, { useState, useEffect } from 'react';
import { XCircle, AlertCircle, RefreshCw, Send, Mail } from 'lucide-react';

interface RejectReasonModalProps {
  isOpen: boolean;
  applicantName: string;
  applicantEmail: string;
  department: string;
  startDate: string;
  endDate: string;
  leaveReason: string;
  initialReason?: string;
  isStatusChange?: boolean;
  onClose: () => void;
  onConfirm: (rejectReason: string, sendEmail: boolean) => Promise<boolean>;
}

export default function RejectReasonModal({
  isOpen,
  applicantName,
  applicantEmail,
  department,
  startDate,
  endDate,
  leaveReason,
  initialReason = '',
  isStatusChange = false,
  onClose,
  onConfirm,
}: RejectReasonModalProps) {
  const [rejectReason, setRejectReason] = useState(initialReason);
  const [sendEmail, setSendEmail] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRejectReason(initialReason || '');
      setErrorMessage('');
      setShowRetry(false);
      setSendEmail(true);
    }
  }, [isOpen, initialReason]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      setErrorMessage('반려 사유를 반드시 입력해 주세요.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setShowRetry(false);

    try {
      const success = await onConfirm(rejectReason.trim(), sendEmail);
      if (success) {
        setRejectReason('');
        onClose();
      } else {
        setErrorMessage('반려 처리 중 문제가 발생했습니다.');
        setShowRetry(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || '오류가 발생했습니다.');
      setShowRetry(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-[16px] bg-white p-6 sm:p-7 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-[#c82014]" />
            <h3 className="text-lg font-extrabold text-[#1E3932]">
              {isStatusChange ? '승인 취소 및 연차 반려 처리' : '연차 신청 반려 및 사유 입력'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-stone-400 hover:text-stone-700 transition"
          >
            ✕
          </button>
        </div>

        {/* 대상 신청서 요약 */}
        <div className="mb-4 rounded-xl bg-stone-50 p-3.5 border border-stone-200 text-xs text-stone-700 space-y-1.5">
          <div className="flex justify-between">
            <span className="font-semibold text-stone-500">신청 사원:</span>
            <span className="font-bold text-stone-900">
              {applicantName} ({applicantEmail}) · {department}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-stone-500">신청 기간:</span>
            <span className="font-bold text-stone-900">
              {startDate} ~ {endDate}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-stone-500">신청 사유:</span>
            <span className="text-stone-800">{leaveReason || '-'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1.5">
              반려 사유 입력 <span className="text-[#c82014]">*</span>
              <span className="font-normal text-stone-500 ml-1">
                (신청 사원이 확인할 사유를 상세히 입력해 주세요)
              </span>
            </label>
            <textarea
              required
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="예: 해당 기간 내 분기 마감 및 긴급 프로젝트 릴리즈 일정이 잡혀 있어 일정 조정 부탁드립니다."
              className="w-full rounded-xl border border-stone-300 p-3 text-xs text-stone-900 outline-none focus:border-[#c82014] focus:ring-1 focus:ring-[#c82014] transition"
            />
          </div>

          {/* 알림메일 발송 여부 선택 체크박스 */}
          <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200/60">
            <label className="flex items-center gap-2.5 text-xs font-bold text-stone-800 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-[#00754A] focus:ring-[#00754A]"
              />
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 text-[#00754A]" />
                사원 이메일({applicantEmail})로 반려 알림 메일 즉시 발송
              </span>
            </label>
            <p className="text-[11px] text-stone-500 mt-1 pl-6">
              체크 시 사원에게 입력하신 사유가 포함된 공식 반려 결과 메일이 자동 전송됩니다.
            </p>
          </div>

          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-semibold text-[#c82014] border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-pill rounded-full border border-stone-300 bg-white px-4 py-2 text-xs font-bold text-stone-700 transition hover:bg-stone-50"
            >
              취소
            </button>

            <button
              type="submit"
              disabled={loading}
              className="btn-pill flex items-center gap-1.5 rounded-full bg-[#c82014] hover:bg-[#a61a10] px-5 py-2 text-xs font-bold text-white shadow-xs transition disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>반려 처리 중...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span>{sendEmail ? '반려 확정 및 메일 발송' : '반려만 확정'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
