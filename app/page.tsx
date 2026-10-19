'use client';

import { useState, useEffect, useCallback, useMemo, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import {
  Calendar as CalendarIcon,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Send,
  RefreshCw,
  CalendarRange,
  FileText,
  Lock,
  Mail,
  ShieldAlert,
  KeyRound,
  X,
  ArrowLeft,
  Building2,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  Info,
  Plus,
  Home as HomeIcon,
  CheckSquare,
  Settings,
  CalendarCheck,
} from 'lucide-react';

interface LeaveRequest {
  id: string;
  email: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: '대기' | '승인' | '반려';
  created_at: string;
}

interface MemberInfo {
  email: string;
  이름?: string | null;
  부서?: string | null;
  역할?: '직원' | '팀장' | null;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // 멤버 정보 (내 정보)
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);

  // 팀장용: 전체 멤버 맵 (email -> MemberInfo)
  const [membersMap, setMembersMap] = useState<Record<string, MemberInfo>>({});

  // 참고 화면 기반 네비게이션 탭 ('requests': 목록/결재함, 'calendar': 일정/달력, 'settings': 설정/비번변경)
  const [activeNavTab, setActiveNavTab] = useState<'requests' | 'calendar' | 'settings'>('requests');

  // 참고 화면 목록 상단 필터 탭 ('all': 전체, 'pending': 대기, 'approved': 승인/완료, 'rejected': 반려)
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // 직원용 연차 신청 모달 열림 여부 (참고 화면의 우측 상단 '새 요청' 버튼에 매핑)
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // 달력 상태 (년/월)
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  // 달력/목록 상세 모달 선택 항목
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // 인증 폼 상태 (로그인 / 가입 / 비밀번호 찾기 모드)
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // 비밀번호 재설정(메일 링크로 들어온 Recovery 모드) 상태
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  // 비밀번호 변경 모달/폼 상태
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [changePasswordInput, setChangePasswordInput] = useState('');
  const [changePasswordConfirm, setChangePasswordConfirm] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // 연차 신청 폼 상태
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // 목록 상태
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 오류 메시지 한국어 변환 함수
  const formatAuthErrorMessage = (error: any): string => {
    if (!error) return '';
    const rawMsg = error.message || String(error);
    const lower = rawMsg.toLowerCase();

    if (
      lower.includes('password should be at least 6 characters') ||
      lower.includes('password is too short') ||
      lower.includes('at least 6 characters')
    ) {
      return '비밀번호는 6자 이상으로 해 주세요';
    }

    if (
      lower.includes('invalid login credentials') ||
      lower.includes('invalid credentials') ||
      lower.includes('invalid email or password')
    ) {
      return '이메일 또는 비밀번호가 맞지 않습니다';
    }

    if (
      lower.includes('user already registered') ||
      lower.includes('email already registered') ||
      lower.includes('already exists') ||
      lower.includes('already registered')
    ) {
      return '이미 가입된 이메일입니다. 로그인으로 들어오세요';
    }

    if (
      lower.includes('email not confirmed') ||
      lower.includes('email confirmation')
    ) {
      return '확인 메일 설정이 켜져 있습니다. 강사에게 알려 주세요';
    }

    return `기타 오류가 발생했습니다 (${rawMsg})`;
  };

  // 신청 목록 불러오기 (RLS 규칙에 의해 걸러진 결과를 그대로 표시)
  const fetchRequests = useCallback(async () => {
    setListLoading(true);
    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('목록 불러오기 실패:', error);
      } else {
        setRequests((data as LeaveRequest[]) || []);
      }
    } catch (err) {
      console.error('목록 불러오기 예외:', err);
    } finally {
      setListLoading(false);
    }
  }, []);

  // 전체 멤버 목록 조회 (팀장용: 이름/부서 매핑)
  const fetchAllMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('members').select('*');
      if (!error && data) {
        const map: Record<string, MemberInfo> = {};
        (data as any[]).forEach((item) => {
          map[item.email] = {
            email: item.email,
            이름: item['이름'] || null,
            부서: item['부서'] || null,
            역할: item['역할'] || null,
          };
        });
        setMembersMap(map);
      }
    } catch (err) {
      console.error('멤버 목록 로드 예외:', err);
    }
  }, []);

  // 내 멤버 정보(이름, 부서, 역할) 조회
  const fetchMemberInfo = useCallback(
    async (userEmail: string) => {
      setRoleLoading(true);
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .eq('email', userEmail)
          .maybeSingle();

        if (error) {
          console.error('멤버 정보 조회 오류:', error);
          setMemberInfo(null);
        } else if (data) {
          const item = data as any;
          const info: MemberInfo = {
            email: item.email,
            이름: item['이름'] || null,
            부서: item['부서'] || null,
            역할: item['역할'] || null,
          };
          setMemberInfo(info);
          if (info.역할 === '팀장') {
            fetchAllMembers();
          }
        } else {
          setMemberInfo(null);
        }
      } catch (err) {
        console.error('멤버 정보 조회 예외:', err);
        setMemberInfo(null);
      } finally {
        setRoleLoading(false);
        setRoleLoaded(true);
      }
    },
    [fetchAllMembers]
  );

  // 인증 상태 확인 및 구독
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
          setIsRecoveryMode(true);
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error('세션 확인 중 오류:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }

      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (!currentUser) {
        setMemberInfo(null);
        setRoleLoaded(false);
        setRequests([]);
        setMembersMap({});
        setStartDate('');
        setEndDate('');
        setReason('');
        setFormError('');
        setFormSuccess('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 로그인 사용자 변경 시 데이터 로드
  useEffect(() => {
    if (user && user.email) {
      fetchMemberInfo(user.email);
      fetchRequests();
    } else {
      setMemberInfo(null);
      setRoleLoaded(false);
      setRequests([]);
      setMembersMap({});
    }
  }, [user, fetchMemberInfo, fetchRequests]);

  // 로그인 / 회원가입 제출 핸들러
  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (password.length < 6) {
      setAuthError('비밀번호는 6자 이상으로 해 주세요');
      return;
    }

    if (authMode === 'signup') {
      if (!name.trim()) {
        setAuthError('직원이름을 입력해 주세요.');
        return;
      }
      if (!department.trim()) {
        setAuthError('부서를 입력해 주세요.');
        return;
      }
    }

    setAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const trimmedEmail = email.trim();
        const trimmedName = name.trim();
        const trimmedDept = department.trim();

        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              name: trimmedName,
              department: trimmedDept,
            },
          },
        });

        if (error) {
          setAuthError(formatAuthErrorMessage(error));
        } else {
          if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
            setAuthError('이미 가입된 이메일입니다. 로그인으로 들어오세요');
            setAuthLoading(false);
            return;
          }

          if (!data.session) {
            const { error: signInErr } = await supabase.auth.signInWithPassword({
              email: trimmedEmail,
              password,
            });
            if (signInErr) {
              setAuthError(formatAuthErrorMessage(signInErr));
              return;
            }
          }

          try {
            await supabase.from('members').insert([
              {
                email: trimmedEmail,
                이름: trimmedName,
                부서: trimmedDept,
                역할: null,
              },
            ]);
          } catch {
            // 트리거 충돌 무시
          }

          setAuthSuccessMsg('회원가입이 완료되었습니다! 관리자 인가 후 연차 신청을 이용하실 수 있습니다.');
        }
      } else if (authMode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthError(formatAuthErrorMessage(error));
        }
      }
    } catch (err: any) {
      setAuthError(formatAuthErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // 비밀번호 재설정 이메일 요청 핸들러
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!email.trim()) {
      setAuthError('이메일 주소를 입력해 주세요.');
      return;
    }

    setAuthLoading(true);
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        setAuthError(formatAuthErrorMessage(error));
      } else {
        setAuthSuccessMsg('비밀번호 재설정 링크를 이메일로 발송했습니다. 받은 편지함을 확인해 주세요.');
      }
    } catch (err: any) {
      setAuthError(formatAuthErrorMessage(err));
    } finally {
      setAuthLoading(false);
    }
  };

  // 새 비밀번호 설정 핸들러 (Recovery 모드)
  const handleRecoverySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (recoveryPassword.length < 6) {
      setRecoveryError('비밀번호는 6자 이상으로 해 주세요');
      return;
    }
    if (recoveryPassword !== recoveryPasswordConfirm) {
      setRecoveryError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setRecoveryLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: recoveryPassword,
      });

      if (error) {
        setRecoveryError(formatAuthErrorMessage(error));
      } else {
        setRecoverySuccess('비밀번호가 성공적으로 변경되었습니다!');
        setTimeout(() => {
          setIsRecoveryMode(false);
          setRecoveryPassword('');
          setRecoveryPasswordConfirm('');
          setRecoverySuccess('');
        }, 1500);
      }
    } catch (err: any) {
      setRecoveryError(formatAuthErrorMessage(err));
    } finally {
      setRecoveryLoading(false);
    }
  };

  // 로그인 상태에서 비밀번호 변경 핸들러
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setChangePasswordError('');
    setChangePasswordSuccess('');

    if (changePasswordInput.length < 6) {
      setChangePasswordError('비밀번호는 6자 이상으로 해 주세요');
      return;
    }
    if (changePasswordInput !== changePasswordConfirm) {
      setChangePasswordError('새 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: changePasswordInput,
      });

      if (error) {
        setChangePasswordError(formatAuthErrorMessage(error));
      } else {
        setChangePasswordSuccess('비밀번호가 성공적으로 변경되었습니다!');
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setChangePasswordInput('');
          setChangePasswordConfirm('');
          setChangePasswordSuccess('');
        }, 1500);
      }
    } catch (err: any) {
      setChangePasswordError(formatAuthErrorMessage(err));
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMemberInfo(null);
    setRoleLoaded(false);
    setRequests([]);
    setMembersMap({});
    setStartDate('');
    setEndDate('');
    setReason('');
    setFormError('');
    setFormSuccess('');
    setAuthError('');
    setAuthSuccessMsg('');
    setEmail('');
    setPassword('');
    setName('');
    setDepartment('');
    setIsPasswordModalOpen(false);
    setIsRecoveryMode(false);
    setSelectedRequest(null);
    setIsApplyModalOpen(false);
  };

  // 연차 신청 핸들러 (직원 전용)
  const handleSubmitLeave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!startDate || !endDate) {
      setFormError('시작일과 종료일을 모두 선택해 주세요.');
      return;
    }
    if (startDate > endDate) {
      setFormError('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }
    if (!reason.trim()) {
      setFormError('연차 사유를 입력해 주세요.');
      return;
    }
    if (!user?.email) {
      setFormError('로그인 사용자 정보를 찾을 수 없습니다.');
      return;
    }

    setSubmitLoading(true);
    try {
      const { error } = await supabase.from('leave_requests').insert([
        {
          email: user.email,
          start_date: startDate,
          end_date: endDate,
          reason: reason.trim(),
          status: '대기',
        },
      ]);

      if (error) {
        setFormError(`신청 중 오류가 발생했습니다 (${error.message})`);
      } else {
        setFormSuccess('연차 신청이 완료되었습니다.');
        setStartDate('');
        setEndDate('');
        setReason('');
        fetchRequests();
        setTimeout(() => {
          setIsApplyModalOpen(false);
          setFormSuccess('');
        }, 1200);
      }
    } catch (err: any) {
      setFormError(`신청 중 오류가 발생했습니다 (${err.message || err})`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 승인/반려 상태 변경 핸들러 (팀장 전용) - 처리 시 모달 자동 닫기
  const handleUpdateStatus = async (id: string, newStatus: '승인' | '반려') => {
    setUpdatingId(id);
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) {
        alert(`상태 변경 중 오류가 발생했습니다: ${error.message}`);
      } else {
        setRequests((prev) =>
          prev.map((req) => (req.id === id ? { ...req, status: newStatus } : req))
        );
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest(null);
        }
      }
    } catch (err: any) {
      alert(`상태 변경 실패: ${err.message || err}`);
    } finally {
      setUpdatingId(null);
    }
  };

  // 표시용 이름 생성 헬퍼
  const getMemberLabel = useCallback(
    (reqEmail: string) => {
      const m = membersMap[reqEmail];
      if (m && m.이름) {
        return m.이름;
      }
      return reqEmail.split('@')[0];
    },
    [membersMap]
  );

  const getMemberDepartment = useCallback(
    (reqEmail: string) => {
      const m = membersMap[reqEmail];
      return m?.부서 || '';
    },
    [membersMap]
  );

  // 이니셜/아바타 첫 글자 추출
  const getAvatarChar = useCallback(
    (reqEmail: string) => {
      const name = getMemberLabel(reqEmail);
      return name ? name.charAt(0) : '연';
    },
    [getMemberLabel]
  );

  // 날짜 포맷 (예: 10월 21일 ~ 10월 22일)
  const formatDateRangeText = useCallback((start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const sMonth = s.getMonth() + 1;
      const sDay = s.getDate();
      const eMonth = e.getMonth() + 1;
      const eDay = e.getDate();

      if (start === end) {
        return `${sMonth}월 ${sDay}일`;
      }
      return `${sMonth}월 ${sDay}일 ~ ${eMonth}월 ${eDay}일`;
    } catch {
      return `${start} ~ ${end}`;
    }
  }, []);

  // 통계 요약 계산 (참고 화면의 3개 요약 카드)
  const stats = useMemo(() => {
    const pendingCount = requests.filter((r) => r.status === '대기').length;
    const approvedCount = requests.filter((r) => r.status === '승인').length;
    const rejectedCount = requests.filter((r) => r.status === '반려').length;
    return { pendingCount, approvedCount, rejectedCount };
  }, [requests]);

  // 참고 화면 목록 필터링
  const filteredRequests = useMemo(() => {
    if (filterTab === 'pending') return requests.filter((r) => r.status === '대기');
    if (filterTab === 'approved') return requests.filter((r) => r.status === '승인');
    if (filterTab === 'rejected') return requests.filter((r) => r.status === '반려');
    return requests;
  }, [requests, filterTab]);

  // 달력 계산 (팀장 전용)
  const calendarDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();

    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    const days: {
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }[] = [];

    const todayStr = new Date().toISOString().split('T')[0];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDate - i;
      const prevMonth = month === 0 ? 12 : month;
      const prevYear = month === 0 ? year - 1 : year;
      const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    for (let d = 1; d <= lastDateOfMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remaining = totalSlots - days.length;
    for (let n = 1; n <= remaining; n++) {
      const nextMonth = month === 11 ? 1 : month + 2;
      const nextYear = month === 11 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNumber: n,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [calendarDate]);

  const rejectedRequests = useMemo(() => {
    return requests.filter((r) => r.status === '반려');
  }, [requests]);

  const activeCalendarRequests = useMemo(() => {
    return requests.filter((r) => r.status === '승인' || r.status === '대기');
  }, [requests]);

  const getRequestsForDate = useCallback(
    (dateStr: string) => {
      return activeCalendarRequests.filter(
        (r) => dateStr >= r.start_date && dateStr <= r.end_date
      );
    },
    [activeCalendarRequests]
  );

  // 로딩 화면
  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f0eb]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#00754A] border-t-transparent" />
          <p className="text-sm font-medium text-[rgba(0,0,0,0.58)]">사용자 정보를 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 1. 비밀번호 재설정 모드 (Recovery 화면)
  if (isRecoveryMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f0eb] p-4 font-sans">
        <div className="w-full max-w-md overflow-hidden rounded-[12px] bg-white shadow-[0px_0px_0.5px_0px_rgba(0,0,0,0.14),0px_1px_1px_0px_rgba(0,0,0,0.24)] border border-[#edebe9]">
          <div className="bg-[#1E3932] p-6 text-white text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[#d4e9e2] ring-1 ring-white/20">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">새 비밀번호 설정</h1>
            <p className="mt-1 text-xs text-[rgba(255,255,255,0.70)]">새로운 비밀번호를 입력해 주세요.</p>
          </div>

          <form onSubmit={handleRecoverySubmit} className="space-y-4 p-6 sm:p-8">
            {recoveryError && (
              <div className="flex items-start gap-2.5 rounded-[8px] border border-[#c82014]/20 bg-[#c82014]/5 p-3.5 text-sm text-[#c82014]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="leading-snug">{recoveryError}</div>
              </div>
            )}

            {recoverySuccess && (
              <div className="flex items-start gap-2.5 rounded-[8px] border border-[#00754A]/30 bg-[#d4e9e2]/50 p-3.5 text-sm text-[#006241]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="leading-snug">{recoverySuccess}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1.5">새 비밀번호</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[rgba(0,0,0,0.40)]" />
                <input
                  type="password"
                  required
                  value={recoveryPassword}
                  onChange={(e) => setRecoveryPassword(e.target.value)}
                  placeholder="6자 이상 입력"
                  className="w-full rounded-[8px] border border-[#d6dbde] bg-white py-2.5 pl-10 pr-3 text-sm text-[rgba(0,0,0,0.87)] placeholder:text-[rgba(0,0,0,0.40)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1.5">새 비밀번호 확인</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[rgba(0,0,0,0.40)]" />
                <input
                  type="password"
                  required
                  value={recoveryPasswordConfirm}
                  onChange={(e) => setRecoveryPasswordConfirm(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="w-full rounded-[8px] border border-[#d6dbde] bg-white py-2.5 pl-10 pr-3 text-sm text-[rgba(0,0,0,0.87)] placeholder:text-[rgba(0,0,0,0.40)]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={recoveryLoading}
              className="btn-pill mt-3 flex w-full items-center justify-center rounded-full bg-[#00754A] py-3 text-sm font-semibold text-white transition hover:bg-[#006241] disabled:opacity-50"
            >
              {recoveryLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>변경 중...</span>
                </div>
              ) : (
                '비밀번호 변경 완료'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. 비로그인 사용자: 로그인 / 회원가입 / 비밀번호 찾기
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f2f0eb] p-4 font-sans">
        <div className="w-full max-w-md overflow-hidden rounded-[12px] bg-white shadow-[0px_0px_0.5px_0px_rgba(0,0,0,0.14),0px_1px_1px_0px_rgba(0,0,0,0.24)] border border-[#edebe9]">
          <div className="bg-[#1E3932] p-6 text-white text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-[#d4e9e2] ring-1 ring-white/20">
              <CalendarRange className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">연차 신청함</h1>
            <p className="mt-1 text-xs text-[rgba(255,255,255,0.70)]">간편한 휴가 신청 및 결재 시스템</p>
          </div>

          {authMode !== 'forgot' ? (
            <div className="flex border-b border-[#edebe9] bg-[#edebe9]/40">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError('');
                  setAuthSuccessMsg('');
                }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  authMode === 'signin'
                    ? 'border-b-2 border-[#00754A] bg-white text-[#006241]'
                    : 'text-[rgba(0,0,0,0.58)] hover:text-[#006241]'
                }`}
              >
                로그인
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError('');
                  setAuthSuccessMsg('');
                }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  authMode === 'signup'
                    ? 'border-b-2 border-[#00754A] bg-white text-[#006241]'
                    : 'text-[rgba(0,0,0,0.58)] hover:text-[#006241]'
                }`}
              >
                회원가입
              </button>
            </div>
          ) : (
            <div className="border-b border-[#edebe9] bg-[#edebe9]/40 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-[#006241]">
                <KeyRound className="h-4 w-4" />
                <span>비밀번호 재설정</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError('');
                  setAuthSuccessMsg('');
                }}
                className="flex items-center gap-1 text-xs font-semibold text-[#00754A] hover:text-[#006241]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>로그인으로</span>
              </button>
            </div>
          )}

          {authMode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4 p-6 sm:p-8">
              <p className="text-xs text-[rgba(0,0,0,0.58)] leading-relaxed">
                가입하신 이메일 주소를 입력하시면 비밀번호를 다시 설정할 수 있는 링크를 보내드립니다.
              </p>

              {authError && (
                <div className="flex items-start gap-2.5 rounded-[8px] border border-[#c82014]/20 bg-[#c82014]/5 p-3.5 text-sm text-[#c82014]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="leading-snug">{authError}</div>
                </div>
              )}

              {authSuccessMsg && (
                <div className="flex items-start gap-2.5 rounded-[8px] border border-[#00754A]/30 bg-[#d4e9e2]/50 p-3.5 text-sm text-[#006241]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="leading-snug">{authSuccessMsg}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1.5">가입한 이메일</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[rgba(0,0,0,0.40)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-[8px] border border-[#d6dbde] bg-white py-2.5 pl-10 pr-3 text-sm text-[rgba(0,0,0,0.87)] placeholder:text-[rgba(0,0,0,0.40)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="btn-pill mt-2 flex w-full items-center justify-center rounded-full bg-[#00754A] py-3 text-sm font-semibold text-white transition hover:bg-[#006241] disabled:opacity-50"
              >
                {authLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>발송 중...</span>
                  </div>
                ) : (
                  '재설정 링크 보내기'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleAuthSubmit} className="space-y-4 p-6 sm:p-8">
              {authError && (
                <div className="flex items-start gap-2.5 rounded-[8px] border border-[#c82014]/20 bg-[#c82014]/5 p-3.5 text-sm text-[#c82014]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="leading-snug">{authError}</div>
                </div>
              )}

              {authSuccessMsg && (
                <div className="flex items-start gap-2.5 rounded-[8px] border border-[#00754A]/30 bg-[#d4e9e2]/50 p-3.5 text-sm text-[#006241]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="leading-snug">{authSuccessMsg}</div>
                </div>
              )}

              {authMode === 'signup' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1.5">직원이름</label>
                    <div className="relative">
                      <UserIcon className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[rgba(0,0,0,0.40)]" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="예: 홍길동"
                        className="w-full rounded-[8px] border border-[#d6dbde] bg-white py-2.5 pl-9 pr-3 text-sm text-[rgba(0,0,0,0.87)] placeholder:text-[rgba(0,0,0,0.40)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1.5">부서</label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[rgba(0,0,0,0.40)]" />
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="예: 개발팀"
                        className="w-full rounded-[8px] border border-[#d6dbde] bg-white py-2.5 pl-9 pr-3 text-sm text-[rgba(0,0,0,0.87)] placeholder:text-[rgba(0,0,0,0.40)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1.5">이메일 주소</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[rgba(0,0,0,0.40)]" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-[8px] border border-[#d6dbde] bg-white py-2.5 pl-10 pr-3 text-sm text-[rgba(0,0,0,0.87)] placeholder:text-[rgba(0,0,0,0.40)]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)]">비밀번호</label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setAuthError('');
                        setAuthSuccessMsg('');
                      }}
                      className="text-xs text-[#00754A] hover:text-[#006241] hover:underline"
                    >
                      비밀번호를 잊으셨나요?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[rgba(0,0,0,0.40)]" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6자 이상 입력"
                    className="w-full rounded-[8px] border border-[#d6dbde] bg-white py-2.5 pl-10 pr-3 text-sm text-[rgba(0,0,0,0.87)] placeholder:text-[rgba(0,0,0,0.40)]"
                  />
                </div>
                <p className="mt-1 text-xs text-[rgba(0,0,0,0.58)]">비밀번호는 최소 6자 이상이어야 합니다.</p>
              </div>

              {authMode === 'signup' && (
                <div className="rounded-[8px] bg-[#d4e9e2]/40 p-2.5 text-[11px] text-[#006241] leading-relaxed border border-[#00754A]/20">
                  💡 가입 후 관리자가 <strong>직원</strong> 또는 <strong>팀장</strong>으로 인가하면 서비스 이용이 가능해집니다.
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="btn-pill mt-2 flex w-full items-center justify-center rounded-full bg-[#00754A] py-3 text-sm font-semibold text-white transition hover:bg-[#006241] disabled:opacity-50"
              >
                {authLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>처리 중...</span>
                  </div>
                ) : authMode === 'signin' ? (
                  '로그인'
                ) : (
                  '회원가입 완료하기'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  const role = memberInfo?.역할;
  const displayName = memberInfo?.이름
    ? `${memberInfo.이름} · ${memberInfo.부서 || (role === '팀장' ? '팀장' : '직원')}`
    : user.email;

  // 3. 로그인된 사용자 화면: 참고 화면의 2단 레이아웃 (좌측 네비게이션 + 우측 메인 영역)
  return (
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col md:flex-row font-sans text-[rgba(0,0,0,0.87)]">
      {/* ======================================================== */}
      {/* 1. 좌측 사이드바 (참고화면 좌측 어두운 바) */}
      {/* ======================================================== */}
      <aside className="w-full md:w-64 bg-[#1E3932] text-white flex flex-col justify-between shrink-0 shadow-lg z-20">
        <div>
          {/* 사이드바 상단 로고/서비스명 (참고화면: '업무 포털' 위치) */}
          <div className="px-6 py-7 border-b border-[#2b5148]/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00754A] text-white shadow-xs">
                <CalendarRange className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">연차 신청함</h1>
            </div>
            {role && (
              <div className="mt-2.5">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    role === '팀장'
                      ? 'bg-[#faf6ee] text-[#cba258] ring-1 ring-[#cba258]/40'
                      : 'bg-[#d4e9e2] text-[#006241]'
                  }`}
                >
                  {role} 전용 모드
                </span>
              </div>
            )}
          </div>

          {/* 사이드바 네비게이션 메뉴 (참고화면: 홈, 내 신청, 결재함, 일정, 설정) */}
          <nav className="p-4 space-y-1.5">
            {/* 결재함 / 내 신청 탭 */}
            <button
              type="button"
              onClick={() => setActiveNavTab('requests')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] text-sm font-semibold transition-all text-left ${
                activeNavTab === 'requests'
                  ? 'bg-white/15 text-white shadow-xs'
                  : 'text-[rgba(255,255,255,0.70)] hover:bg-white/5 hover:text-white'
              }`}
            >
              {role === '팀장' ? (
                <>
                  <CheckSquare className="h-4 w-4 shrink-0 text-[#d4e9e2]" />
                  <span>결재함</span>
                  {stats.pendingCount > 0 && (
                    <span className="ml-auto rounded-full bg-[#00754A] px-2 py-0.5 text-[11px] font-bold text-white">
                      {stats.pendingCount}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 shrink-0 text-[#d4e9e2]" />
                  <span>내 신청</span>
                </>
              )}
            </button>

            {/* 일정 (달력) 탭 (팀장 전용) */}
            {role === '팀장' && (
              <button
                type="button"
                onClick={() => setActiveNavTab('calendar')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[8px] text-sm font-semibold transition-all text-left ${
                  activeNavTab === 'calendar'
                    ? 'bg-white/15 text-white shadow-xs'
                    : 'text-[rgba(255,255,255,0.70)] hover:bg-white/5 hover:text-white'
                }`}
              >
                <CalendarDays className="h-4 w-4 shrink-0 text-[#d4e9e2]" />
                <span>일정 (달력)</span>
              </button>
            )}

            {/* 설정 (비밀번호 변경 등) */}
            <button
              type="button"
              onClick={() => {
                setIsPasswordModalOpen(true);
                setChangePasswordError('');
                setChangePasswordSuccess('');
                setChangePasswordInput('');
                setChangePasswordConfirm('');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-[8px] text-sm font-semibold text-[rgba(255,255,255,0.70)] hover:bg-white/5 hover:text-white transition-all text-left"
            >
              <Settings className="h-4 w-4 shrink-0 text-[#d4e9e2]" />
              <span>설정 (비밀번호 변경)</span>
            </button>
          </nav>
        </div>

        {/* 사이드바 하단 프로필 영역 (참고화면: 김하늘 · 경영지원팀) */}
        <div className="p-5 border-t border-[#2b5148]/60 bg-[#172d27]">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate" title={displayName}>
                {displayName}
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.50)] truncate mt-0.5" title={user.email}>
                {user.email}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-pill shrink-0 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white transition"
              title="로그아웃"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* 2. 우측 메인 컨텐츠 영역 (참고화면 우측 구조) */}
      {/* ======================================================== */}
      <main className="flex-1 min-w-0 p-6 sm:p-10 max-w-6xl mx-auto w-full space-y-6">
        {/* 인가 대기 상태 (역할이 null인 경우) */}
        {roleLoaded && !role && (
          <div className="rounded-[12px] border border-[#cba258]/30 bg-[#faf6ee] p-8 text-center shadow-[0px_0px_0.5px_0px_rgba(0,0,0,0.14),0px_1px_1px_0px_rgba(0,0,0,0.24)]">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#dfc49d]/30 text-[#cba258]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            {memberInfo ? (
              <>
                <h2 className="text-lg font-bold text-[#6d5117]">관리자 인가 대기 중입니다</h2>
                <p className="mt-2 text-sm text-[#8c671b] leading-relaxed">
                  등록 정보: <strong>{memberInfo.이름}</strong> / <strong>{memberInfo.부서}</strong> ({memberInfo.email})
                </p>
                <p className="mt-1 text-xs text-[#8c671b]/80">
                  관리자가 사내 명단(members)에서 회원 정보를 확인한 후 <strong>직원</strong> 또는 <strong>팀장</strong>으로 인가하면 서비스를 이용하실 수 있습니다.
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-[#6d5117]">명단에 없습니다. 관리자에게 등록을 요청하세요</h2>
                <p className="mt-1 text-xs text-[#8c671b]">
                  현재 로그인하신 이메일({user.email})은 사내 멤버 명단에 등록되어 있지 않습니다.
                </p>
              </>
            )}
          </div>
        )}

        {/* 인가된 사용자 (직원 or 팀장) */}
        {(role === '직원' || role === '팀장') && (
          <>
            {/* ---------------------------------------------------- */}
            {/* 탭 1: 목록 화면 (참고화면과 100% 동일한 배치·구성) */}
            {/* ---------------------------------------------------- */}
            {activeNavTab === 'requests' && (
              <div className="space-y-6">
                {/* 1) 머리 영역: 대제목 + 설명 문구 + 우측 '새 요청' 버튼 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[rgba(0,0,0,0.87)]">
                      {role === '팀장' ? '결재함' : '내 신청'}
                    </h2>
                    <p className="text-sm text-[rgba(0,0,0,0.58)] mt-1">
                      {role === '팀장'
                        ? '팀원이 올린 요청을 확인하고 처리합니다'
                        : '팀에 제출한 연차 신청 내역을 확인하고 새 연차를 신청합니다'}
                    </p>
                  </div>

                  {/* 우측 상단 액션 버튼 (참고화면: '새 요청' 버튼 위치) */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchRequests}
                      disabled={listLoading}
                      className="btn-pill flex items-center gap-1.5 rounded-full border border-[#d6dbde] bg-white px-3.5 py-2 text-xs font-semibold text-[rgba(0,0,0,0.87)] transition hover:bg-[#edebe9] disabled:opacity-50"
                      title="새로고침"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? 'animate-spin' : ''}`} />
                      <span className="hidden sm:inline">새로고침</span>
                    </button>

                    {/* 직원이면 '새 요청'(연차 신청) 버튼 노출 */}
                    {role === '직원' && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsApplyModalOpen(true);
                          setFormError('');
                          setFormSuccess('');
                        }}
                        className="btn-pill flex items-center gap-2 rounded-full bg-[#00754A] hover:bg-[#006241] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                        <span>새 요청</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* 2) 상단 3개 요약 카드 (참고화면: 처리 대기 | 이번 달 처리 | 반려) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* 카드 1: 처리 대기 */}
                  <div className="card-surface p-5 sm:p-6 rounded-[12px] bg-white border border-[#edebe9]">
                    <div className="text-sm font-semibold text-[rgba(0,0,0,0.58)]">처리 대기</div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-[rgba(0,0,0,0.87)] mt-2">
                      {stats.pendingCount}
                    </div>
                  </div>

                  {/* 카드 2: 승인 (참고화면: 이번 달 처리) */}
                  <div className="card-surface p-5 sm:p-6 rounded-[12px] bg-white border border-[#edebe9]">
                    <div className="text-sm font-semibold text-[rgba(0,0,0,0.58)]">
                      {role === '팀장' ? '이번 달 처리' : '승인 완료'}
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-[rgba(0,0,0,0.87)] mt-2">
                      {stats.approvedCount}
                    </div>
                  </div>

                  {/* 카드 3: 반려 */}
                  <div className="card-surface p-5 sm:p-6 rounded-[12px] bg-white border border-[#edebe9]">
                    <div className="text-sm font-semibold text-[rgba(0,0,0,0.58)]">반려</div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-[rgba(0,0,0,0.87)] mt-2">
                      {stats.rejectedCount}
                    </div>
                  </div>
                </div>

                {/* 3) 필터 탭 (참고화면: 전체 · 대기 · 완료) */}
                <div className="border-b border-[#edebe9] flex items-center gap-6 pt-2">
                  <button
                    type="button"
                    onClick={() => setFilterTab('all')}
                    className={`pb-3 text-sm font-bold transition-all relative ${
                      filterTab === 'all'
                        ? 'text-[rgba(0,0,0,0.87)]'
                        : 'text-[rgba(0,0,0,0.50)] hover:text-[rgba(0,0,0,0.87)]'
                    }`}
                  >
                    전체
                    {filterTab === 'all' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgba(0,0,0,0.87)] rounded-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterTab('pending')}
                    className={`pb-3 text-sm font-bold transition-all relative ${
                      filterTab === 'pending'
                        ? 'text-[rgba(0,0,0,0.87)]'
                        : 'text-[rgba(0,0,0,0.50)] hover:text-[rgba(0,0,0,0.87)]'
                    }`}
                  >
                    대기
                    {filterTab === 'pending' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgba(0,0,0,0.87)] rounded-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterTab('approved')}
                    className={`pb-3 text-sm font-bold transition-all relative ${
                      filterTab === 'approved'
                        ? 'text-[rgba(0,0,0,0.87)]'
                        : 'text-[rgba(0,0,0,0.50)] hover:text-[rgba(0,0,0,0.87)]'
                    }`}
                  >
                    완료
                    {filterTab === 'approved' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgba(0,0,0,0.87)] rounded-full" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterTab('rejected')}
                    className={`pb-3 text-sm font-bold transition-all relative ${
                      filterTab === 'rejected'
                        ? 'text-[rgba(0,0,0,0.87)]'
                        : 'text-[rgba(0,0,0,0.50)] hover:text-[rgba(0,0,0,0.87)]'
                    }`}
                  >
                    반려
                    {filterTab === 'rejected' && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgba(0,0,0,0.87)] rounded-full" />
                    )}
                  </button>
                </div>

                {/* 4) 참고화면 형태의 독립 카드 목록 (List Item Cards) */}
                {filteredRequests.length === 0 ? (
                  <div className="card-surface rounded-[12px] p-12 text-center bg-white border border-[#edebe9]">
                    <CalendarIcon className="mx-auto h-12 w-12 text-[#d6dbde]" />
                    <p className="mt-3 text-sm font-medium text-[rgba(0,0,0,0.58)]">
                      해당하는 연차 신청 내역이 없습니다.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRequests.map((req) => {
                      const applicant = getMemberLabel(req.email);
                      const dept = getMemberDepartment(req.email);
                      const avatarChar = getAvatarChar(req.email);
                      const dateRangeStr = formatDateRangeText(req.start_date, req.end_date);
                      const isPending = req.status === '대기';
                      const isApproved = req.status === '승인';
                      const isRejected = req.status === '반려';

                      return (
                        <div
                          key={req.id}
                          className="card-surface rounded-[12px] bg-white border border-[#edebe9] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-[#d6dbde] hover:shadow-md"
                        >
                          {/* 좌측: 원형 아바타 + 신청자 · 사유 + 날짜 · 부서 */}
                          <div className="flex items-center gap-4 min-w-0">
                            {/* 성(이니셜) 원형 아바타 (참고화면: 박, 이, 최) */}
                            <div className="h-11 w-11 shrink-0 rounded-full bg-[#edebe9] text-[#1E3932] flex items-center justify-center font-bold text-base shadow-2xs">
                              {avatarChar}
                            </div>

                            <div className="min-w-0">
                              {/* 상단 굵은 타이틀: 신청자 · 사유 (참고화면: 박서준 · 출장비 정산) */}
                              <div className="text-base font-bold text-[rgba(0,0,0,0.87)] truncate">
                                {applicant} · {req.reason}
                              </div>

                              {/* 하단 서브텍스트: 날짜 기간 · 부서 (참고화면: 10월 21일 ~ 10월 22일 · 거래처 방문) */}
                              <div className="text-xs text-[rgba(0,0,0,0.58)] mt-1 flex items-center gap-1.5 flex-wrap">
                                <span>{dateRangeStr}</span>
                                {dept && (
                                  <>
                                    <span>·</span>
                                    <span>{dept}</span>
                                  </>
                                )}
                                {req.email === user.email && (
                                  <span className="rounded bg-[#d4e9e2] px-1.5 py-0.2 text-[10px] font-bold text-[#006241]">
                                    나
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 우측: 상태 뱃지 및 액션 버튼 (참고화면: 대기 [처리] [보류] or [완료]) */}
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                            {/* 상태 뱃지 */}
                            {isPending && (
                              <span className="rounded-[6px] bg-[#f2f0eb] px-2.5 py-1 text-xs font-semibold text-[rgba(0,0,0,0.70)]">
                                대기
                              </span>
                            )}
                            {isApproved && (
                              <span className="rounded-[6px] bg-[#d4e9e2] px-2.5 py-1 text-xs font-semibold text-[#006241]">
                                완료
                              </span>
                            )}
                            {isRejected && (
                              <span className="rounded-[6px] bg-[#c82014]/10 px-2.5 py-1 text-xs font-semibold text-[#c82014]">
                                반려
                              </span>
                            )}

                            {/* 팀장일 때: 대기 건에 대해 [승인(처리)] 및 [반려(보류)] 버튼 (참고화면 버튼 위치!) */}
                            {role === '팀장' && isPending && (
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(req.id, '승인')}
                                  disabled={updatingId === req.id}
                                  className="btn-pill rounded-[6px] bg-[rgba(0,0,0,0.87)] hover:bg-[#00754A] px-4 py-1.5 text-xs font-semibold text-white transition active:scale-95 disabled:opacity-50"
                                >
                                  승인
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateStatus(req.id, '반려')}
                                  disabled={updatingId === req.id}
                                  className="btn-pill rounded-[6px] border border-[#d6dbde] bg-white hover:bg-[#edebe9] px-4 py-1.5 text-xs font-semibold text-[rgba(0,0,0,0.87)] transition active:scale-95 disabled:opacity-50"
                                >
                                  반려
                                </button>
                              </div>
                            )}

                            {/* 상세 보기 버튼 */}
                            <button
                              type="button"
                              onClick={() => setSelectedRequest(req)}
                              className="btn-pill rounded-[6px] border border-[#d6dbde] bg-white hover:bg-[#edebe9] px-3 py-1.5 text-xs font-medium text-[rgba(0,0,0,0.70)] transition"
                            >
                              상세
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ---------------------------------------------------- */}
            {/* 탭 2: 팀장 전용 일정 (달력) 탭 */}
            {/* ---------------------------------------------------- */}
            {activeNavTab === 'calendar' && role === '팀장' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[rgba(0,0,0,0.87)]">
                    연차 일정 (달력)
                  </h2>
                  <p className="text-sm text-[rgba(0,0,0,0.58)] mt-1">
                    팀원들의 승인된 연차 및 대기 현황을 달력에서 확인합니다
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
                  {/* 메인 달력 (3열) */}
                  <div className="card-surface rounded-[12px] border border-[#edebe9] bg-white p-6 xl:col-span-3">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#edebe9] pb-4">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-[#006241]">
                          {calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월
                        </h3>
                        <div className="flex items-center rounded-full border border-[#d6dbde] bg-white shadow-2xs overflow-hidden">
                          <button
                            type="button"
                            onClick={() =>
                              setCalendarDate(
                                new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
                              )
                            }
                            className="p-1.5 text-[rgba(0,0,0,0.70)] hover:bg-[#edebe9] transition"
                            title="이전 달"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCalendarDate(new Date())}
                            className="px-2.5 py-1 text-xs font-semibold text-[rgba(0,0,0,0.87)] hover:bg-[#edebe9] border-x border-[#d6dbde] transition"
                          >
                            오늘
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setCalendarDate(
                                new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1)
                              )
                            }
                            className="p-1.5 text-[rgba(0,0,0,0.70)] hover:bg-[#edebe9] transition"
                            title="다음 달"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full bg-[#00754A]" />
                          <span className="text-[#006241] font-semibold">승인 완료 (초록색)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="h-3 w-3 rounded-full bg-[#fbbc05]" />
                          <span className="text-[#996f00] font-semibold">승인 대기 (노란색)</span>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-[8px] border border-[#edebe9] bg-white">
                      <div className="grid grid-cols-7 border-b border-[#edebe9] bg-[#edebe9]/50 text-center text-xs font-bold text-[rgba(0,0,0,0.87)]">
                        <div className="py-2.5 text-[#c82014]">일</div>
                        <div className="py-2.5">월</div>
                        <div className="py-2.5">화</div>
                        <div className="py-2.5">수</div>
                        <div className="py-2.5">목</div>
                        <div className="py-2.5">금</div>
                        <div className="py-2.5 text-[#006241]">토</div>
                      </div>

                      <div className="grid grid-cols-7 divide-x divide-y divide-[#edebe9]/70">
                        {calendarDays.map((day, idx) => {
                          const dayRequests = getRequestsForDate(day.dateStr);

                          return (
                            <div
                              key={idx}
                              className={`min-h-[105px] p-2 transition flex flex-col justify-between ${
                                !day.isCurrentMonth
                                  ? 'bg-[#edebe9]/30 text-[rgba(0,0,0,0.25)]'
                                  : 'bg-white hover:bg-[#edebe9]/20'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-xs font-bold inline-flex h-6 w-6 items-center justify-center rounded-full ${
                                    day.isToday
                                      ? 'bg-[#00754A] text-white shadow-xs'
                                      : !day.isCurrentMonth
                                      ? 'text-[rgba(0,0,0,0.25)]'
                                      : idx % 7 === 0
                                      ? 'text-[#c82014]'
                                      : idx % 7 === 6
                                      ? 'text-[#006241]'
                                      : 'text-[rgba(0,0,0,0.87)]'
                                  }`}
                                >
                                  {day.dayNumber}
                                </span>
                                {dayRequests.length > 0 && day.isCurrentMonth && (
                                  <span className="text-[10px] font-bold text-[rgba(0,0,0,0.40)]">
                                    {dayRequests.length}명
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1 overflow-y-auto max-h-[80px]">
                                {dayRequests.map((req) => {
                                  const isApproved = req.status === '승인';
                                  const label = getMemberLabel(req.email);

                                  return (
                                    <button
                                      key={req.id}
                                      type="button"
                                      onClick={() => setSelectedRequest(req)}
                                      className={`w-full text-left truncate rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold transition ${
                                        isApproved
                                          ? 'bg-[#d4e9e2] text-[#006241] border border-[#00754A]/30'
                                          : 'bg-[#faf6ee] text-[#996f00] border border-[#cba258]/40'
                                      }`}
                                    >
                                      <span className="truncate block">
                                        {isApproved ? '🟢 ' : '🟡 '}
                                        {label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* 우측 사이드바: 반려 목록 */}
                  <div className="card-surface rounded-[12px] border border-[#c82014]/20 bg-white p-5 xl:col-span-1">
                    <div className="mb-3 flex items-center justify-between border-b border-[#edebe9] pb-3">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-[#c82014]" />
                        <h4 className="text-sm font-bold text-[rgba(0,0,0,0.87)]">반려된 신청</h4>
                      </div>
                      <span className="rounded-full bg-[#c82014]/10 px-2 py-0.5 text-xs font-bold text-[#c82014]">
                        {rejectedRequests.length}건
                      </span>
                    </div>

                    <p className="text-xs text-[rgba(0,0,0,0.58)] mb-3">
                      반려 처리된 연차는 달력에서 제외되며 여기에 보관됩니다.
                    </p>

                    {rejectedRequests.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[rgba(0,0,0,0.40)]">
                        반려된 신청이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
                        {rejectedRequests.map((req) => (
                          <div
                            key={req.id}
                            onClick={() => setSelectedRequest(req)}
                            className="cursor-pointer rounded-[8px] border border-[#edebe9] bg-[#fafafa] p-3 transition hover:border-[#c82014]/30"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[rgba(0,0,0,0.87)]">
                                {getMemberLabel(req.email)}
                              </span>
                              <span className="text-[10px] text-[#c82014] font-bold">반려</span>
                            </div>
                            <div className="text-[11px] text-[rgba(0,0,0,0.58)] mt-1">
                              {formatDateRangeText(req.start_date, req.end_date)}
                            </div>
                            <div className="text-[11px] text-[rgba(0,0,0,0.70)] mt-0.5 truncate">
                              사유: {req.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* ======================================================== */}
      {/* 3. 모달 레이어들 (연차 신청, 비밀번호 변경, 상세 모달) */}
      {/* ======================================================== */}

      {/* 직원의 '새 요청' (연차 신청) 모달 */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[12px] bg-white p-6 sm:p-7 shadow-2xl border border-[#edebe9]">
            <div className="flex items-center justify-between border-b border-[#edebe9] pb-3.5 mb-5">
              <div className="flex items-center gap-2">
                <CalendarRange className="h-5 w-5 text-[#006241]" />
                <h3 className="text-lg font-bold text-[#006241]">새 연차 신청</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="rounded-full p-1 text-[rgba(0,0,0,0.40)] hover:bg-[#f2f0eb] hover:text-[rgba(0,0,0,0.87)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-[8px] border border-[#c82014]/20 bg-[#c82014]/5 p-3 text-sm text-[#c82014]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="mb-4 flex items-start gap-2.5 rounded-[8px] border border-[#00754A]/30 bg-[#d4e9e2]/50 p-3 text-sm text-[#006241]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1.5">
                    시작일 <span className="text-[#c82014]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-[8px] border border-[#d6dbde] bg-white px-3.5 py-2.5 text-sm text-[rgba(0,0,0,0.87)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1.5">
                    종료일 <span className="text-[#c82014]">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded-[8px] border border-[#d6dbde] bg-white px-3.5 py-2.5 text-sm text-[rgba(0,0,0,0.87)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1.5">
                  연차 사유 <span className="text-[#c82014]">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="예: 개인 사유, 병가, 휴식 등"
                  className="w-full rounded-[8px] border border-[#d6dbde] bg-white px-3.5 py-2.5 text-sm text-[rgba(0,0,0,0.87)] placeholder:text-[rgba(0,0,0,0.40)]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-[#edebe9]">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="btn-pill rounded-full border border-[#d6dbde] px-5 py-2.5 text-xs font-semibold text-[rgba(0,0,0,0.87)] hover:bg-[#edebe9]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="btn-pill flex items-center gap-2 rounded-full bg-[#00754A] hover:bg-[#006241] px-6 py-2.5 text-xs font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-50"
                >
                  {submitLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>연차 신청하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 비밀번호 변경 모달 */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[12px] bg-white p-6 shadow-2xl border border-[#edebe9]">
            <div className="flex items-center justify-between border-b border-[#edebe9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#006241]" />
                <h3 className="text-base font-bold text-[#006241]">비밀번호 변경</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="rounded-full p-1 text-[rgba(0,0,0,0.40)] hover:bg-[#f2f0eb] hover:text-[rgba(0,0,0,0.87)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {changePasswordError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-[8px] border border-[#c82014]/20 bg-[#c82014]/5 p-3 text-sm text-[#c82014]">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="leading-snug">{changePasswordError}</div>
              </div>
            )}

            {changePasswordSuccess && (
              <div className="mb-4 flex items-start gap-2.5 rounded-[8px] border border-[#00754A]/30 bg-[#d4e9e2]/50 p-3 text-sm text-[#006241]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="leading-snug">{changePasswordSuccess}</div>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1">새 비밀번호</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[rgba(0,0,0,0.40)]" />
                  <input
                    type="password"
                    required
                    value={changePasswordInput}
                    onChange={(e) => setChangePasswordInput(e.target.value)}
                    placeholder="6자 이상 입력"
                    className="w-full rounded-[8px] border border-[#d6dbde] bg-white py-2 pl-10 pr-3 text-sm text-[rgba(0,0,0,0.87)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[rgba(0,0,0,0.87)] mb-1">새 비밀번호 확인</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[rgba(0,0,0,0.40)]" />
                  <input
                    type="password"
                    required
                    value={changePasswordConfirm}
                    onChange={(e) => setChangePasswordConfirm(e.target.value)}
                    placeholder="새 비밀번호 다시 입력"
                    className="w-full rounded-[8px] border border-[#d6dbde] bg-white py-2 pl-10 pr-3 text-sm text-[rgba(0,0,0,0.87)]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="btn-pill rounded-full border border-[#d6dbde] px-4 py-2 text-xs font-semibold text-[rgba(0,0,0,0.87)] hover:bg-[#edebe9]"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="btn-pill flex items-center gap-1.5 rounded-full bg-[#00754A] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#006241] disabled:opacity-50"
                >
                  {changePasswordLoading && (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}
                  <span>변경하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 연차 상세 정보 모달 */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[12px] bg-white p-6 shadow-2xl border border-[#edebe9]">
            <div className="flex items-center justify-between border-b border-[#edebe9] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#006241]" />
                <h3 className="text-base font-bold text-[#006241]">연차 상세 정보</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-full p-1 text-[rgba(0,0,0,0.40)] hover:bg-[#f2f0eb] hover:text-[rgba(0,0,0,0.87)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-[rgba(0,0,0,0.87)]">
              <div className="flex justify-between py-1 border-b border-[#edebe9]/50">
                <span className="text-xs font-semibold text-[rgba(0,0,0,0.58)]">신청자</span>
                <span className="font-semibold text-[rgba(0,0,0,0.87)]">
                  {getMemberLabel(selectedRequest.email)} {getMemberDepartment(selectedRequest.email) ? `(${getMemberDepartment(selectedRequest.email)})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edebe9]/50">
                <span className="text-xs font-semibold text-[rgba(0,0,0,0.58)]">이메일</span>
                <span className="text-[rgba(0,0,0,0.70)]">{selectedRequest.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edebe9]/50">
                <span className="text-xs font-semibold text-[rgba(0,0,0,0.58)]">신청 기간</span>
                <span className="font-semibold text-[rgba(0,0,0,0.87)]">
                  {selectedRequest.start_date} ~ {selectedRequest.end_date}
                </span>
              </div>
              <div className="py-1 border-b border-[#edebe9]/50">
                <span className="block text-xs font-semibold text-[rgba(0,0,0,0.58)] mb-1">연차 사유</span>
                <p className="rounded-[8px] bg-[#edebe9]/40 p-2.5 text-xs text-[rgba(0,0,0,0.87)] break-words">
                  {selectedRequest.reason}
                </p>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-xs font-semibold text-[rgba(0,0,0,0.58)]">현재 상태</span>
                <div>
                  {selectedRequest.status === '승인' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#d4e9e2] px-3 py-1 text-xs font-semibold text-[#006241]">
                      완료 (승인)
                    </span>
                  )}
                  {selectedRequest.status === '대기' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f0eb] px-3 py-1 text-xs font-semibold text-[rgba(0,0,0,0.70)]">
                      대기
                    </span>
                  )}
                  {selectedRequest.status === '반려' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#c82014]/10 px-3 py-1 text-xs font-semibold text-[#c82014]">
                      반려
                    </span>
                  )}
                </div>
              </div>
            </div>

            {role === '팀장' && (
              <div className="flex justify-end gap-2 pt-5 border-t border-[#edebe9] mt-4">
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedRequest.id, '반려')}
                  disabled={updatingId === selectedRequest.id || selectedRequest.status === '반려'}
                  className="btn-pill rounded-full border border-[#c82014] bg-white px-4 py-2 text-xs font-semibold text-[#c82014] hover:bg-[#c82014]/5 disabled:opacity-50"
                >
                  반려 처리
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedRequest.id, '승인')}
                  disabled={updatingId === selectedRequest.id || selectedRequest.status === '승인'}
                  className="btn-pill rounded-full bg-[#00754A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#006241] disabled:opacity-50"
                >
                  승인 처리
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
