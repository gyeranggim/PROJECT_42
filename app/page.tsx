'use client';

import { useState, useEffect, useCallback, useMemo, useRef, FormEvent } from 'react';
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
  Download,
  Building,
  BarChart3,
  Eye,
  Printer,
} from 'lucide-react';

import SignaturePad from '@/app/components/SignaturePad';
import { LeaveDocumentPreview } from '@/app/components/LeaveDocumentPreview';
import RejectReasonModal from '@/app/components/RejectReasonModal';
import AccountantDashboard, {
  MemberRecord,
  LeaveRequestRecord,
} from '@/app/components/AccountantDashboard';
import { generateLeavePdfBlob } from '@/lib/pdfGenerator';

interface LeaveRequest {
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

interface MemberInfo {
  email: string;
  이름?: string | null;
  부서?: string | null;
  역할?: '직원' | '팀장' | '경리담당자' | null;
  hire_date?: string | null;
}

// URL에서 Supabase 인증 토큰(해시 또는 쿼리스트링)을 정밀 추출하는 헬퍼 함수
function extractAuthTokens(): {
  accessToken?: string;
  refreshToken?: string;
  type?: string;
  code?: string;
  error?: string;
  errorDescription?: string;
} {
  if (typeof window === 'undefined') return {};

  const fullHref = window.location.href;
  const hash = window.location.hash || '';
  const search = window.location.search || '';

  // 1. PKCE Code (search params 또는 hash)
  const searchParams = new URLSearchParams(search);
  let code = searchParams.get('code') || undefined;
  let error = searchParams.get('error') || searchParams.get('error_code') || undefined;
  let errorDesc = searchParams.get('error_description') || undefined;

  if (!code && hash) {
    const codeMatch = hash.match(/[?&#]code=([^&#]+)/);
    if (codeMatch) code = decodeURIComponent(codeMatch[1]);
  }

  // 2. Hash tokens (access_token, refresh_token, type)
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  let type: string | undefined;

  const accessMatch = fullHref.match(/[#&?]access_token=([^&#]+)/);
  if (accessMatch) accessToken = decodeURIComponent(accessMatch[1]);

  const refreshMatch = fullHref.match(/[#&?]refresh_token=([^&#]+)/);
  if (refreshMatch) refreshToken = decodeURIComponent(refreshMatch[1]);

  const typeMatch = fullHref.match(/[#&?]type=([^&#]+)/);
  if (typeMatch) type = decodeURIComponent(typeMatch[1]);

  if (!error) {
    const errorMatch = fullHref.match(/[#&?]error=([^&#]+)/);
    if (errorMatch) error = decodeURIComponent(errorMatch[1]);
  }
  if (!errorDesc) {
    const errorDescMatch = fullHref.match(/[#&?]error_description=([^&#]+)/);
    if (errorDescMatch) errorDesc = decodeURIComponent(errorDescMatch[1].replace(/\+/g, ' '));
  }

  return { accessToken, refreshToken, type, code, error, errorDescription: errorDesc };
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // 멤버 정보 (내 정보)
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleLoaded, setRoleLoaded] = useState(false);

  // 팀장/경리용: 전체 멤버 맵 (email -> MemberInfo)
  const [membersMap, setMembersMap] = useState<Record<string, MemberInfo>>({});
  const [allMembersList, setAllMembersList] = useState<MemberInfo[]>([]);

  // 네비게이션 탭 ('requests': 목록/결재함, 'calendar': 일정/달력, 'accountant': 경리 대시보드, 'settings': 설정/비번변경)
  const [activeNavTab, setActiveNavTab] = useState<'requests' | 'calendar' | 'accountant' | 'settings'>('requests');

  // 목록 상단 필터 탭 ('all': 전체, 'pending': 대기, 'approved': 승인/완료, 'rejected': 반려)
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // 연차 신청 모달 상태
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [leaveType, setLeaveType] = useState<'종일' | '오전반차' | '오후반차'>('종일');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const documentPrintRef = useRef<HTMLDivElement | null>(null);

  // 반려 사유 모달 상태
  const [rejectingRequest, setRejectingRequest] = useState<LeaveRequest | null>(null);

  // 연차유급휴가신청서 정식 원본 미리보기 모달 상태
  const [previewDocRequest, setPreviewDocRequest] = useState<LeaveRequest | null>(null);

  // 팀장 결재 승인 시 자동 도장 날인 PDF 생성용 상태 및 Ref
  const [approvingRequest, setApprovingRequest] = useState<LeaveRequest | null>(null);
  const approvalDocRef = useRef<HTMLDivElement | null>(null);

  // 알림 메일 발송 중인 요청 ID 상태
  const [emailSendingId, setEmailSendingId] = useState<string | null>(null);

  // 달력 상태 (년/월 및 부서 필터)
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [calendarDeptFilter, setCalendarDeptFilter] = useState<string>('all');
  // 결재함/목록 부서 필터
  const [requestsDeptFilter, setRequestsDeptFilter] = useState<string>('all');
  // 달력/목록 상세 모달 선택 항목
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  // 달력에서 병합된 사원 클릭 시 표시할 모달
  const [mergedModalRequests, setMergedModalRequests] = useState<{
    dateStr: string;
    userName: string;
    email: string;
    department: string;
    requests: LeaveRequest[];
  } | null>(null);

  // 인증 폼 상태 (로그인 / 가입 / 비밀번호 찾기 모드)
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');

  // 비밀번호 재설정 상태
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState('');
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState('');
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  // 비밀번호 변경 모달 상태
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [changePasswordInput, setChangePasswordInput] = useState('');
  const [changePasswordConfirm, setChangePasswordConfirm] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // 목록 상태
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 오류 메시지 한국어 변환
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
      return '확인 메일 설정이 켜져 있습니다. 관리자에게 문의해 주세요';
    }

    if (
      lower.includes('auth session missing') ||
      lower.includes('session missing') ||
      lower.includes('session from the url') ||
      lower.includes('session not found')
    ) {
      return '인증 세션이 만료되었거나 유효하지 않습니다. 재설정 링크를 다시 요청해 주세요.';
    }

    return `기타 오류가 발생했습니다 (${rawMsg})`;
  };

  // 신청 목록 불러오기
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

  // 전체 멤버 목록 조회 (팀장/경리용)
  const fetchAllMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('members').select('*');
      if (!error && data) {
        const map: Record<string, MemberInfo> = {};
        const list: MemberInfo[] = [];
        (data as any[]).forEach((item) => {
          const info: MemberInfo = {
            email: item.email,
            이름: item['이름'] || null,
            부서: item['부서'] || null,
            역할: item['역할'] || null,
            hire_date: item['hire_date'] || null,
          };
          map[item.email] = info;
          list.push(info);
        });
        setMembersMap(map);
        setAllMembersList(list);
      }
    } catch (err) {
      console.error('멤버 목록 로드 예외:', err);
    }
  }, []);

  // 내 멤버 정보 조회
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
            hire_date: item['hire_date'] || null,
          };
          setMemberInfo(info);

          // 팀장이거나 경리담당자면 전체 멤버 목록 로드
          if (info.역할 === '팀장' || info.역할 === '경리담당자') {
            fetchAllMembers();
          }

          // 팀장이면 캘린더 및 결재함 부서 기본 필터를 내 소속 부서로 설정
          if (info.역할 === '팀장' && info.부서) {
            setCalendarDeptFilter(info.부서);
            setRequestsDeptFilter(info.부서);
          }

          // 경리담당자면 기본 탭을 'accountant'로 설정
          if (info.역할 === '경리담당자') {
            setActiveNavTab('accountant');
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
        const tokens = extractAuthTokens();

        if (tokens.error) {
          setRecoveryError(`인증 링크 오류: ${tokens.errorDescription || tokens.error}`);
          setIsRecoveryMode(true);
        } else if (tokens.code) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(tokens.code);
            if (!error && data.session) {
              setUser(data.session.user);
              setIsRecoveryMode(true);
            } else if (error) {
              console.warn('PKCE 코드 교환 경고:', error.message);
            }
          } catch (codeErr) {
            console.error('PKCE 코드 교환 예외:', codeErr);
          }
        } else if (tokens.accessToken && tokens.refreshToken) {
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken,
            });
            if (!error && data.session) {
              setUser(data.session.user);
              setIsRecoveryMode(true);
            } else if (error) {
              console.warn('토큰 세션 설정 경고:', error.message);
            }
          } catch (tokenErr) {
            console.error('토큰 세션 설정 예외:', tokenErr);
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          if (
            tokens.type === 'recovery' ||
            (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))
          ) {
            setIsRecoveryMode(true);
          }
        } else if (
          tokens.type === 'recovery' ||
          (typeof window !== 'undefined' && window.location.hash.includes('type=recovery'))
        ) {
          setIsRecoveryMode(true);
          setRecoveryError('인증 세션이 만료되었거나 유효하지 않습니다. 아래 버튼을 눌러 재설정 메일을 다시 요청해 주세요.');
        }
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
        setAllMembersList([]);
        setStartDate('');
        setEndDate('');
        setReason('');
        setSignatureDataUrl(null);
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
      setAllMembersList([]);
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
          } catch (mErr) {
            console.error('members 삽입 예외:', mErr);
          }

          setAuthSuccessMsg('회원가입이 완료되었습니다. 관리자 인가 후 이용 가능합니다.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthError(formatAuthErrorMessage(error));
        }
      }
    } catch (err: any) {
      setAuthError(`처리 중 오류가 발생했습니다 (${err.message || err})`);
    } finally {
      setAuthLoading(false);
    }
  };

  // 비밀번호 찾기(재설정 메일 발송) 핸들러
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    if (!email.trim()) {
      setAuthError('이메일을 입력해 주세요');
      return;
    }

    setAuthLoading(true);
    try {
      const redirectUrl =
        typeof window !== 'undefined'
          ? `${window.location.origin}`
          : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        setAuthError(`메일 전송 실패: ${formatAuthErrorMessage(error)}`);
      } else {
        setAuthSuccessMsg('비밀번호 재설정 링크를 메일로 보냈습니다. 받은편지함을 확인하세요.');
      }
    } catch (err: any) {
      setAuthError(`오류가 발생했습니다 (${err.message || err})`);
    } finally {
      setAuthLoading(false);
    }
  };

  // 복구 모드에서 새 비밀번호 설정 핸들러
  const handleUpdateRecoveryPassword = async (e: FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (recoveryPassword.length < 6) {
      setRecoveryError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (recoveryPassword !== recoveryPasswordConfirm) {
      setRecoveryError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setRecoveryLoading(true);
    try {
      // 1. 활성 세션이 있는지 확인하고 없으면 URL 토큰으로 재시도
      let {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const tokens = extractAuthTokens();
        if (tokens.accessToken && tokens.refreshToken) {
          const { data: setRes } = await supabase.auth.setSession({
            access_token: tokens.accessToken,
            refresh_token: tokens.refreshToken,
          });
          session = setRes?.session || null;
        } else if (tokens.code) {
          const { data: exRes } = await supabase.auth.exchangeCodeForSession(tokens.code);
          session = exRes?.session || null;
        }
      }

      if (!session) {
        setRecoveryError(
          '인증 세션이 유효하지 않거나 만료되었습니다. 아래 "재설정 링크 다시 받기"를 눌러 재설정 메일을 다시 받아주세요.'
        );
        setRecoveryLoading(false);
        return;
      }

      // 2. 새 비밀번호 적용
      const { error } = await supabase.auth.updateUser({
        password: recoveryPassword,
      });

      if (error) {
        setRecoveryError(`비밀번호 변경 실패: ${formatAuthErrorMessage(error)}`);
      } else {
        setRecoverySuccess('비밀번호가 성공적으로 변경되었습니다! 로그인 화면으로 이동합니다.');
        setTimeout(() => {
          setIsRecoveryMode(false);
          setRecoveryPassword('');
          setRecoveryPasswordConfirm('');
          if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }, 1500);
      }
    } catch (err: any) {
      setRecoveryError(`오류가 발생했습니다 (${err.message || err})`);
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
      setChangePasswordError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (changePasswordInput !== changePasswordConfirm) {
      setChangePasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: changePasswordInput,
      });

      if (error) {
        setChangePasswordError(`비밀번호 변경 실패: ${formatAuthErrorMessage(error)}`);
      } else {
        setChangePasswordSuccess('비밀번호가 성공적으로 변경되었습니다.');
        setTimeout(() => {
          setIsPasswordModalOpen(false);
          setChangePasswordInput('');
          setChangePasswordConfirm('');
          setChangePasswordSuccess('');
        }, 1200);
      }
    } catch (err: any) {
      setChangePasswordError(`오류가 발생했습니다 (${err.message || err})`);
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // 로그아웃 핸들러
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMemberInfo(null);
    setRoleLoaded(false);
    setRequests([]);
    setMembersMap({});
    setAllMembersList([]);
    setStartDate('');
    setEndDate('');
    setReason('');
    setSignatureDataUrl(null);
    setFormError('');
    setFormSuccess('');
    setIsPasswordModalOpen(false);
    setIsRecoveryMode(false);
    setSelectedRequest(null);
    setIsApplyModalOpen(false);
  };

  // 연차 신청서 제출 핸들러 (PDF 생성 + 전자서명 + Storage 저장 + DB 기록)
  const handleSubmitLeave = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!startDate) {
      setFormError('시작일을 선택해 주세요.');
      return;
    }
    const finalEndDate = leaveType.includes('반차') ? startDate : endDate;
    if (!finalEndDate) {
      setFormError('종료일을 선택해 주세요.');
      return;
    }
    if (startDate > finalEndDate) {
      setFormError('종료일은 시작일보다 빠를 수 없습니다.');
      return;
    }
    if (!reason.trim()) {
      setFormError('연차 사유를 입력해 주세요.');
      return;
    }
    if (!signatureDataUrl) {
      setFormError('전자서명을 완료해 주세요. (필수)');
      return;
    }
    if (!user?.email) {
      setFormError('로그인 사용자 정보를 찾을 수 없습니다.');
      return;
    }

    setSubmitLoading(true);
    try {
      let pdfPublicUrl: string | null = null;

      // 1. PDF 생성
      if (documentPrintRef.current) {
        try {
          const pdfBlob = await generateLeavePdfBlob(documentPrintRef.current);
          const deptRaw = memberInfo?.부서 || 'general';
          const deptCode = deptRaw.includes('영업')
            ? 'sales'
            : deptRaw.includes('마케팅')
            ? 'marketing'
            : deptRaw.includes('인사') || deptRaw.includes('경리')
            ? 'hr_finance'
            : deptRaw.includes('개발')
            ? 'dev'
            : 'dept_' + (user.email.split('@')[0]);

          const userSlug = user.email.split('@')[0];
          const dateClean = startDate.replace(/-/g, '');
          const now = new Date();
          const timestamp = `${String(now.getHours()).padStart(2, '0')}${String(
            now.getMinutes()
          ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

          // S3/Supabase Storage 규격에 맞춘 안전한 파일명
          const fileName = `leave_${deptCode}_${userSlug}_${dateClean}_${timestamp}.pdf`;
          const filePath = `${deptCode}/${fileName}`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('leave-documents')
            .upload(filePath, pdfBlob, {
              contentType: 'application/pdf',
              upsert: true,
            });

          if (!uploadError && uploadData) {
            const { data: urlData } = supabase.storage
              .from('leave-documents')
              .getPublicUrl(filePath);
            pdfPublicUrl = urlData.publicUrl;
          } else if (uploadError) {
            console.warn('스토리지 PDF 업로드 경고:', uploadError.message);
          }
        } catch (pdfErr) {
          console.error('PDF 생성 및 업로드 중 예외:', pdfErr);
        }
      }

      // 2. DB에 연차 신청 데이터 삽입
      const { error } = await supabase.from('leave_requests').insert([
        {
          email: user.email,
          user_name: memberInfo?.이름 || user.email.split('@')[0],
          department: memberInfo?.부서 || '미배정',
          start_date: startDate,
          end_date: finalEndDate,
          leave_type: leaveType,
          reason: reason.trim(),
          status: '대기',
          pdf_url: pdfPublicUrl,
          signature_data: signatureDataUrl,
        },
      ]);

      if (error) {
        setFormError(`신청 중 오류가 발생했습니다 (${error.message})`);
      } else {
        setFormSuccess('전자서명된 연차신청서가 성공적으로 제출 및 보관되었습니다.');
        setStartDate('');
        setEndDate('');
        setReason('');
        setSignatureDataUrl(null);
        fetchRequests();
        setTimeout(() => {
          setIsApplyModalOpen(false);
          setFormSuccess('');
        }, 1300);
      }
    } catch (err: any) {
      setFormError(`신청 중 오류가 발생했습니다 (${err.message || err})`);
    } finally {
      setSubmitLoading(false);
    }
  };

  // 팀장용: 승인 처리 (사원 서명 + 팀장 승인 도장 날인된 최종본 PDF 자동 생성 및 스토리지 갱신)
  const handleApprove = async (id: string) => {
    setUpdatingId(id);
    try {
      const targetReq = requests.find((r) => r.id === id);
      if (!targetReq) return;

      // 1. 사원 서명과 팀장 승인 도장이 함께 찍힌 상태로 승인 서식 렌더링 세팅
      const approvedTarget: LeaveRequest = { ...targetReq, status: '승인' };
      setApprovingRequest(approvedTarget);

      // DOM 렌더링 완료 대기
      await new Promise((resolve) => setTimeout(resolve, 350));

      let finalApprovedPdfUrl = targetReq.pdf_url;

      // 2. 사원 서명 + 팀장 승인 도장이 결합된 최종 A4 PDF 생성 & Supabase Storage 업로드
      if (approvalDocRef.current) {
        try {
          const pdfBlob = await generateLeavePdfBlob(approvalDocRef.current);
          const deptRaw = targetReq.department || 'general';
          const deptCode = deptRaw.includes('영업')
            ? 'sales'
            : deptRaw.includes('마케팅')
            ? 'marketing'
            : deptRaw.includes('인사') || deptRaw.includes('경리')
            ? 'hr_finance'
            : 'general';

          const userSlug = targetReq.email.split('@')[0];
          const dateClean = targetReq.start_date.replace(/-/g, '');
          const now = new Date();
          const timestamp = `${String(now.getHours()).padStart(2, '0')}${String(
            now.getMinutes()
          ).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;

          const fileName = `leave_${deptCode}_${userSlug}_${dateClean}_approved_${timestamp}.pdf`;
          const filePath = `${deptCode}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('leave-documents')
            .upload(filePath, pdfBlob, {
              contentType: 'application/pdf',
              upsert: true,
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('leave-documents')
              .getPublicUrl(filePath);
            finalApprovedPdfUrl = urlData.publicUrl;
          } else {
            console.warn('승인 PDF 업로드 경고:', uploadError.message);
          }
        } catch (pdfErr) {
          console.error('승인 PDF 자동 생성 중 오류:', pdfErr);
        }
      }

      // 3. DB 업데이트: status = '승인', pdf_url = finalApprovedPdfUrl, reject_reason = null
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: '승인',
          pdf_url: finalApprovedPdfUrl,
          reject_reason: null,
        })
        .eq('id', id);

      if (error) {
        alert(`승인 처리 중 오류: ${error.message}`);
      } else {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: '승인', pdf_url: finalApprovedPdfUrl, reject_reason: null }
              : r
          )
        );
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest((prev) =>
            prev
              ? { ...prev, status: '승인', pdf_url: finalApprovedPdfUrl, reject_reason: null }
              : null
          );
        }
        if (mergedModalRequests) {
          setMergedModalRequests((prev) =>
            prev
              ? {
                  ...prev,
                  requests: prev.requests.map((r) =>
                    r.id === id
                      ? { ...r, status: '승인', pdf_url: finalApprovedPdfUrl, reject_reason: null }
                      : r
                  ),
                }
              : null
          );
        }

        // 승인 완료 후 사원에게 알림메일 발송 여부 묻기
        const sendMailConfirm = window.confirm(
          `승인 처리가 완료되었습니다 (팀장 승인 도장 날인 완료).\n\n신청 사원(${targetReq.email})에게 승인 알림 메일을 바로 발송하시겠습니까?`
        );
        if (sendMailConfirm) {
          await handleSendApprovalEmail({
            ...targetReq,
            status: '승인',
            pdf_url: finalApprovedPdfUrl,
          });
        }
      }
    } catch (err: any) {
      alert(`승인 처리 실패: ${err.message || err}`);
    } finally {
      setApprovingRequest(null);
      setUpdatingId(null);
    }
  };

  // 팀장용: 승인 알림메일 전송 함수
  const handleSendApprovalEmail = async (req: LeaveRequest) => {
    setEmailSendingId(req.id);
    try {
      const applicantName = req.user_name || getMemberLabel(req.email);
      const applicantDept = req.department || getMemberDepartment(req.email);

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: req.email,
          type: 'approval',
          data: {
            userName: applicantName,
            department: applicantDept,
            startDate: req.start_date,
            endDate: req.end_date,
            leaveType: req.leave_type || '종일',
            reason: req.reason,
            pdfUrl: req.pdf_url,
          },
        }),
      });

      const emailResult = await res.json();
      if (res.ok && emailResult.success) {
        alert(`${applicantName} 사원(${req.email})에게 승인 알림 메일이 성공적으로 발송되었습니다.`);
      } else {
        alert(`메일 발송 결과: ${emailResult.error || '메일 발송 실패'}`);
      }
    } catch (err: any) {
      alert(`메일 발송 중 오류: ${err.message || err}`);
    } finally {
      setEmailSendingId(null);
    }
  };

  // 팀장용: 반려 알림메일 전송 함수
  const handleSendRejectionEmail = async (req: LeaveRequest) => {
    setEmailSendingId(req.id);
    try {
      const applicantName = req.user_name || getMemberLabel(req.email);
      const applicantDept = req.department || getMemberDepartment(req.email);

      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: req.email,
          type: 'rejection',
          data: {
            userName: applicantName,
            department: applicantDept,
            startDate: req.start_date,
            endDate: req.end_date,
            leaveType: req.leave_type || '종일',
            reason: req.reason,
            rejectReason: req.reject_reason || '사유 미지정',
            pdfUrl: req.pdf_url,
          },
        }),
      });

      const emailResult = await res.json();
      if (res.ok && emailResult.success) {
        alert(`${applicantName} 사원(${req.email})에게 반려 안내 메일이 성공적으로 발송되었습니다.`);
      } else {
        alert(`메일 발송 결과: ${emailResult.error || '메일 발송 실패'}`);
      }
    } catch (err: any) {
      alert(`메일 발송 중 오류: ${err.message || err}`);
    } finally {
      setEmailSendingId(null);
    }
  };

  // 팀장용: 반려 사유 입력 모달 확인 및 이메일 자동 발송
  const handleConfirmRejectionWithEmail = async (
    rejectReasonText: string,
    sendEmail: boolean = true
  ): Promise<boolean> => {
    if (!rejectingRequest) return false;
    const reqId = rejectingRequest.id;

    try {
      // 1. DB 상태 및 반려 사유 업데이트
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: '반려',
          reject_reason: rejectReasonText,
        })
        .eq('id', reqId);

      if (error) {
        throw new Error(`DB 업데이트 실패: ${error.message}`);
      }

      // 2. 신청한 사원에게 피드백 메일 발송 (체크 시)
      if (sendEmail) {
        try {
          const res = await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: rejectingRequest.email,
              type: 'rejection',
              data: {
                userName: rejectingRequest.user_name || getMemberLabel(rejectingRequest.email),
                department: rejectingRequest.department || getMemberDepartment(rejectingRequest.email),
                startDate: rejectingRequest.start_date,
                endDate: rejectingRequest.end_date,
                leaveType: rejectingRequest.leave_type || '종일',
                reason: rejectingRequest.reason,
                rejectReason: rejectReasonText,
                pdfUrl: rejectingRequest.pdf_url,
              },
            }),
          });

          const emailResult = await res.json();
          if (!res.ok || !emailResult.success) {
            alert(
              `[안내] 연차는 정상 반려 처리되었으나, 알림 이메일은 발송되지 않았습니다.\n(${emailResult.error || 'SMTP 발신 계정 미설정'})`
            );
          } else {
            alert(`${rejectingRequest.user_name || rejectingRequest.email} 사원에게 반려 안내 메일이 성공적으로 발송되었습니다.`);
          }
        } catch (mailErr) {
          console.error('메일 전송 API 호출 실패:', mailErr);
        }
      }

      // 3. 로컬 상태 갱신
      setRequests((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? { ...r, status: '반려', reject_reason: rejectReasonText }
            : r
        )
      );
      if (selectedRequest && selectedRequest.id === reqId) {
        setSelectedRequest((prev) =>
          prev ? { ...prev, status: '반려', reject_reason: rejectReasonText } : null
        );
      }
      if (mergedModalRequests) {
        setMergedModalRequests((prev) =>
          prev
            ? {
                ...prev,
                requests: prev.requests.map((r) =>
                  r.id === reqId
                    ? { ...r, status: '반려', reject_reason: rejectReasonText }
                    : r
                ),
              }
            : null
        );
      }

      setRejectingRequest(null);
      return true;
    } catch (err: any) {
      alert(`반려 처리 중 오류가 발생했습니다: ${err.message || err}`);
      return false;
    }
  };

  // 멤버 이름 라벨 생성
  const getMemberLabel = useCallback(
    (reqEmail: string) => {
      const m = membersMap[reqEmail];
      if (m && m.이름) return m.이름;
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

  const getAvatarChar = useCallback(
    (reqEmail: string) => {
      const n = getMemberLabel(reqEmail);
      return n ? n.charAt(0) : '연';
    },
    [getMemberLabel]
  );

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

  // 전체 등록된 부서 목록 추출 (결재함 및 달력 부서 필터링용)
  const departmentList = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      const dept = r.department || getMemberDepartment(r.email);
      if (dept && dept !== '미배정' && dept !== '부서미지정' && dept.trim() !== '') {
        set.add(dept.trim());
      }
    });
    allMembersList.forEach((m) => {
      if (m.부서 && m.부서 !== '미배정' && m.부서 !== '부서미지정' && m.부서.trim() !== '') {
        set.add(m.부서.trim());
      }
    });
    if (memberInfo?.부서 && memberInfo.부서.trim() !== '') {
      set.add(memberInfo.부서.trim());
    }
    if (set.size === 0) {
      ['영업1팀', '마케팅팀', '인사경리팀'].forEach((d) => set.add(d));
    }
    return Array.from(set).sort();
  }, [requests, allMembersList, memberInfo, getMemberDepartment]);

  // 결재함/신청 목록용 부서 필터링된 기본 신청건들
  const requestsDeptFilteredList = useMemo(() => {
    let list = requests;
    if (memberInfo?.역할 === '직원' && user?.email) {
      return list.filter((r) => r.email === user.email);
    }
    if (requestsDeptFilter !== 'all') {
      list = list.filter((r) => {
        const dept = r.department || getMemberDepartment(r.email);
        return dept === requestsDeptFilter;
      });
    }
    return list;
  }, [requests, memberInfo, user, requestsDeptFilter, getMemberDepartment]);

  // 통계 요약 (참고 화면의 3개 요약 카드 - 선택된 부서 반영)
  const stats = useMemo(() => {
    const pendingCount = requestsDeptFilteredList.filter((r) => r.status === '대기').length;
    const approvedCount = requestsDeptFilteredList.filter((r) => r.status === '승인').length;
    const rejectedCount = requestsDeptFilteredList.filter((r) => r.status === '반려').length;
    return { pendingCount, approvedCount, rejectedCount };
  }, [requestsDeptFilteredList]);

  // 필터링 적용된 목록 (부서 필터 + 상태 탭 필터 결합)
  const filteredRequests = useMemo(() => {
    if (filterTab === 'pending') return requestsDeptFilteredList.filter((r) => r.status === '대기');
    if (filterTab === 'approved') return requestsDeptFilteredList.filter((r) => r.status === '승인');
    if (filterTab === 'rejected') return requestsDeptFilteredList.filter((r) => r.status === '반려');
    return requestsDeptFilteredList;
  }, [requestsDeptFilteredList, filterTab]);

  // 달력 날짜 매트릭스 계산
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

  // 달력용 부서 필터링된 연차 신청 목록
  const calendarFilteredRequests = useMemo(() => {
    if (calendarDeptFilter === 'all') return requests;
    return requests.filter((r) => {
      const dept = r.department || getMemberDepartment(r.email);
      return dept === calendarDeptFilter;
    });
  }, [requests, calendarDeptFilter, getMemberDepartment]);

  // PRD 2.1: 팀장 캘린더 화면 최적화 (동일인 중복/연속 신청 병합 & 상태별 컬러 코딩)
  const getMergedDayLeaves = useCallback(
    (dateStr: string) => {
      // 선택된 부서 필터에 해당하는 신청건만 추출
      const matching = calendarFilteredRequests.filter(
        (r) => dateStr >= r.start_date && dateStr <= r.end_date
      );

      // 사원(email)별로 그룹핑
      const emailGroups: Record<string, LeaveRequest[]> = {};
      matching.forEach((r) => {
        if (!emailGroups[r.email]) {
          emailGroups[r.email] = [];
        }
        emailGroups[r.email].push(r);
      });

      // 동일인 중복 신청 병합 블록 생성
      return Object.entries(emailGroups).map(([emailKey, userRequests]) => {
        const uName = userRequests[0]?.user_name || getMemberLabel(emailKey);
        const dept = userRequests[0]?.department || getMemberDepartment(emailKey);

        // 상태 우선순위: 대기 > 승인 > 반려
        let mergedStatus: '대기' | '승인' | '반려' = '승인';
        if (userRequests.some((r) => r.status === '대기')) {
          mergedStatus = '대기';
        } else if (userRequests.every((r) => r.status === '반려')) {
          mergedStatus = '반려';
        }

        // 반차/종일 라벨링
        const types = userRequests.map((r) => r.leave_type || '종일');
        let typeLabel = '';
        if (types.includes('오전반차') && types.includes('오후반차')) {
          typeLabel = '[오전+오후]';
        } else if (types.includes('오전반차')) {
          typeLabel = '[오전반차]';
        } else if (types.includes('오후반차')) {
          typeLabel = '[오후반차]';
        } else if (userRequests.length > 1) {
          typeLabel = `(${userRequests.length}건)`;
        }

        return {
          email: emailKey,
          userName: uName,
          department: dept,
          requests: userRequests,
          mergedStatus,
          displayLabel: `${uName} ${typeLabel}`.trim(),
        };
      });
    },
    [calendarFilteredRequests, getMemberLabel, getMemberDepartment]
  );

  const rejectedRequests = useMemo(() => {
    return calendarFilteredRequests.filter((r) => r.status === '반려');
  }, [calendarFilteredRequests]);

  // 로딩 화면
  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#00754A] border-t-transparent" />
          <span className="text-sm font-semibold text-[rgba(0,0,0,0.58)]">
            연차 시스템을 불러오는 중...
          </span>
        </div>
      </div>
    );
  }

  // 1. 미로그인 또는 복구 모드 화면
  if (!user || isRecoveryMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb] px-4 py-8">
        <div className="w-full max-w-md rounded-[12px] bg-white p-7 sm:p-8 shadow-xl border border-[#edebe9]">
          {isRecoveryMode ? (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#d4e9e2] text-[#006241] mb-3">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#1E3932]">새 비밀번호 설정</h2>
                <p className="text-xs text-[rgba(0,0,0,0.58)] mt-1">
                  새로운 비밀번호를 입력하여 계정을 복구하세요
                </p>
              </div>

              {recoveryError && (
                <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{recoveryError}</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-rose-200/60 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRecoveryMode(false);
                        setAuthMode('forgot');
                        setRecoveryError('');
                        if (typeof window !== 'undefined') {
                          window.history.replaceState(null, '', window.location.pathname);
                        }
                      }}
                      className="font-bold text-rose-800 hover:underline"
                    >
                      재설정 링크 다시 받기 →
                    </button>
                  </div>
                </div>
              )}
              {recoverySuccess && (
                <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{recoverySuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateRecoveryPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">새 비밀번호</label>
                  <input
                    type="password"
                    required
                    value={recoveryPassword}
                    onChange={(e) => setRecoveryPassword(e.target.value)}
                    placeholder="6자 이상 입력"
                    className="w-full rounded-xl border border-stone-300 p-3 text-sm outline-none focus:border-[#00754A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">새 비밀번호 확인</label>
                  <input
                    type="password"
                    required
                    value={recoveryPasswordConfirm}
                    onChange={(e) => setRecoveryPasswordConfirm(e.target.value)}
                    placeholder="새 비밀번호 다시 입력"
                    className="w-full rounded-xl border border-stone-300 p-3 text-sm outline-none focus:border-[#00754A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={recoveryLoading}
                  className="btn-pill w-full rounded-full bg-[#00754A] py-3 text-sm font-bold text-white transition hover:bg-[#006241]"
                >
                  {recoveryLoading ? '저장 중...' : '비밀번호 변경 및 완료'}
                </button>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(false);
                      setAuthMode('signin');
                      setRecoveryError('');
                      if (typeof window !== 'undefined') {
                        window.history.replaceState(null, '', window.location.pathname);
                      }
                    }}
                    className="text-xs font-semibold text-[#00754A] hover:underline"
                  >
                    로그인 화면으로 돌아가기
                  </button>
                </div>
              </form>
            </div>
          ) : authMode === 'forgot' ? (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#d4e9e2] text-[#006241] mb-3">
                  <Mail className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#1E3932]">비밀번호 찾기</h2>
                <p className="text-xs text-[rgba(0,0,0,0.58)] mt-1">
                  가입하신 이메일로 비밀번호 재설정 링크를 보내드립니다
                </p>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {authError}
                </div>
              )}
              {authSuccessMsg && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {authSuccessMsg}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">이메일</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@company.com"
                    className="w-full rounded-xl border border-stone-300 p-3 text-sm outline-none focus:border-[#00754A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-pill w-full rounded-full bg-[#00754A] py-3 text-sm font-bold text-white transition hover:bg-[#006241]"
                >
                  {authLoading ? '전송 중...' : '재설정 링크 보내기'}
                </button>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setAuthError('');
                      setAuthSuccessMsg('');
                    }}
                    className="text-xs font-semibold text-[#00754A] hover:underline"
                  >
                    로그인 화면으로 돌아가기
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div className="text-center mb-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#00754A] text-white mb-3">
                  <CalendarRange className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-extrabold text-[#1E3932]">연차 관리 시스템</h2>
                <p className="text-xs text-stone-500 mt-1">
                  {authMode === 'signin' ? '계정에 로그인하세요' : '새 계정을 생성합니다'}
                </p>
              </div>

              {authError && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                  {authError}
                </div>
              )}
              {authSuccessMsg && (
                <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  {authSuccessMsg}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                {authMode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        직원이름 <span className="text-[#c82014]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="예: 홍길동"
                        className="w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-[#00754A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        소속 부서 <span className="text-[#c82014]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder="예: 영업1팀, 개발팀, 인사경리팀"
                        className="w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-[#00754A]"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">이메일</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@company.com"
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-[#00754A]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-stone-700">비밀번호</label>
                    {authMode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setAuthError('');
                          setAuthSuccessMsg('');
                        }}
                        className="text-[11px] text-stone-500 hover:text-[#00754A]"
                      >
                        비밀번호를 잊으셨나요?
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6자 이상 입력"
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-sm outline-none focus:border-[#00754A]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-pill w-full rounded-full bg-[#00754A] hover:bg-[#006241] py-3 text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 mt-2"
                >
                  {authLoading
                    ? '처리 중...'
                    : authMode === 'signin'
                    ? '로그인'
                    : '가입 신청 완료'}
                </button>
              </form>

              <div className="text-center pt-4 border-t border-stone-100 mt-5">
                {authMode === 'signin' ? (
                  <p className="text-xs text-stone-600">
                    아직 계정이 없으신가요?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        setAuthError('');
                        setAuthSuccessMsg('');
                      }}
                      className="font-bold text-[#00754A] hover:underline"
                    >
                      회원가입
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-stone-600">
                    이미 계정이 있으신가요?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin');
                        setAuthError('');
                        setAuthSuccessMsg('');
                      }}
                      className="font-bold text-[#00754A] hover:underline"
                    >
                      로그인으로 이동
                    </button>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. 로그인 상태지만 members에 없는 사용자 (미등록 차단 화면)
  if (roleLoaded && !memberInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb] px-4">
        <div className="w-full max-w-md rounded-[12px] bg-white p-8 text-center shadow-xl border border-[#edebe9]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold text-[#1E3932] mb-2">접근 제한 안내</h2>
          <p className="text-sm font-medium text-stone-700 mb-6 leading-relaxed">
            명단에 없습니다. 관리자에게 등록을 요청하세요
          </p>
          <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-500 mb-6 font-mono">
            로그인 계정: {user.email}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-pill w-full rounded-full border border-stone-300 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  const role = memberInfo?.역할;
  const isAuthorized = role === '직원' || role === '팀장' || role === '경리담당자';

  if (roleLoaded && !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f0eb] px-4">
        <div className="w-full max-w-md rounded-[12px] bg-white p-8 text-center shadow-xl border border-[#edebe9]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <Clock className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-extrabold text-[#1E3932] mb-2">인가 대기 중</h2>
          <p className="text-sm font-medium text-stone-700 mb-6 leading-relaxed">
            회원가입이 완료되었습니다. 관리자가 역할을 인가할 때까지 대기해 주세요.
          </p>
          <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-500 mb-6">
            <div>이름: {memberInfo?.이름 || '-'}</div>
            <div>부서: {memberInfo?.부서 || '-'}</div>
            <div>계정: {user.email}</div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-pill w-full rounded-full border border-stone-300 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50"
          >
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  // 3. 인가된 사용자 메인 대시보드 화면
  return (
    <div className="min-h-screen bg-[#f2f0eb] flex flex-col md:flex-row">
      {/* ---------------------------------------------------- */}
      {/* A. 좌측 네비게이션 사이드바 (House Green #1E3932) */}
      {/* ---------------------------------------------------- */}
      <aside className="w-full md:w-64 bg-[#1E3932] text-white flex-shrink-0 flex flex-col justify-between p-5 md:min-h-screen sticky top-0 z-20">
        <div>
          {/* 상단 시스템 헤더 */}
          <div className="flex items-center gap-3 pb-6 border-b border-white/10 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight">연차 관리 시스템</div>
              <div className="text-[11px] text-white/70">근태 및 결재 포털</div>
            </div>
          </div>

          {/* 메인 메뉴 네비게이션 */}
          <nav className="space-y-1.5">
            {/* 경리담당자 전용: 전사 대시보드 */}
            {role === '경리담당자' && (
              <button
                type="button"
                onClick={() => setActiveNavTab('accountant')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeNavTab === 'accountant'
                    ? 'bg-[#00754A] text-white shadow-xs'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                <span>전사 대시보드 & 잔여 연차</span>
              </button>
            )}

            {/* 전체/내 신청 목록 */}
            <button
              type="button"
              onClick={() => setActiveNavTab('requests')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                activeNavTab === 'requests'
                  ? 'bg-[#00754A] text-white shadow-xs'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>
                {role === '팀장' ? '결재함' : role === '경리담당자' ? '신청함 (전체)' : '내 신청 목록'}
              </span>
            </button>

            {/* 팀장 전용: 일정 (달력) */}
            {role === '팀장' && (
              <button
                type="button"
                onClick={() => setActiveNavTab('calendar')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                  activeNavTab === 'calendar'
                    ? 'bg-[#00754A] text-white shadow-xs'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <CalendarDays className="h-4 w-4" />
                <span>일정 (달력)</span>
              </button>
            )}

            {/* 비밀번호 변경 */}
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white/70 hover:bg-white/5 hover:text-white transition"
            >
              <KeyRound className="h-4 w-4" />
              <span>비밀번호 변경</span>
            </button>
          </nav>
        </div>

        {/* 하단 사용자 프로필 및 로그아웃 카드 */}
        <div className="pt-6 border-t border-white/10 mt-6">
          <div className="rounded-xl bg-white/5 p-3.5 border border-white/10 mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-extrabold text-xs text-white">
                {memberInfo?.이름 || user?.email?.split('@')[0] || ''}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00754A] text-white">
                {role}
              </span>
            </div>
            <div className="text-[11px] text-white/70 mb-0.5">{memberInfo?.부서 || '부서미지정'}</div>
            <div className="text-[10px] text-white/50 truncate font-mono">{user?.email || ''}</div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setChangePasswordInput('');
                setChangePasswordConfirm('');
                setChangePasswordError('');
                setChangePasswordSuccess('');
                setIsPasswordModalOpen(true);
              }}
              className="btn-pill w-full flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/15 text-white/90 py-2.5 text-xs font-bold transition active:scale-95"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>비밀번호 변경</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="btn-pill w-full flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/15 text-white/90 py-2.5 text-xs font-bold transition active:scale-95"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* B. 우측 메인 콘텐츠 영역 (Warm Cream #f2f0eb) */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-6xl mx-auto w-full">
        {/* ==================================================== */}
        {/* 탭 1: 경리담당자 전용 대시보드 */}
        {/* ==================================================== */}
        {activeNavTab === 'accountant' && role === '경리담당자' && (
          <AccountantDashboard
            members={allMembersList as MemberRecord[]}
            requests={requests as LeaveRequestRecord[]}
            onRefresh={() => {
              fetchAllMembers();
              fetchRequests();
            }}
          />
        )}

        {/* ==================================================== */}
        {/* 탭 2: 결재함 / 내 신청 목록 */}
        {/* ==================================================== */}
        {activeNavTab === 'requests' && (
          <div className="space-y-6">
            {/* 1) 상단 머리 영역 (Page Header) */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E3932]">
                  {role === '팀장' ? '결재함' : role === '경리담당자' ? '전사 신청함' : '내 신청'}
                </h1>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  {role === '팀장'
                    ? '팀원이 제출한 연차 신청서를 검토하고 승인 또는 반려합니다.'
                    : role === '경리담당자'
                    ? '전사 임직원의 연차 신청서 및 보관된 전자 문서를 열람합니다.'
                    : '제출한 연차 신청 내역을 확인하고 전자서명된 새 연차를 신청합니다.'}
                </p>
              </div>

              {/* 우측 상단 액션 버튼 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchRequests}
                  disabled={listLoading}
                  className="btn-pill flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-3.5 py-2 text-xs font-bold text-stone-800 transition hover:bg-stone-50"
                  title="새로고침"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${listLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">새로고침</span>
                </button>

                {/* 직원 또는 팀장이면 '새 연차 신청' 버튼 노출 */}
                {(role === '직원' || role === '팀장') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsApplyModalOpen(true);
                      setFormError('');
                      setFormSuccess('');
                      setSignatureDataUrl(null);
                    }}
                    className="btn-pill flex items-center gap-2 rounded-full bg-[#00754A] hover:bg-[#006241] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95"
                  >
                    <Plus className="h-4 w-4" />
                    <span>새 연차 신청</span>
                  </button>
                )}
              </div>
            </div>

            {/* 2) 상단 3개 요약 메트릭 카드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-[12px] bg-white p-5 border border-[#edebe9] shadow-xs">
                <div className="text-xs font-bold text-stone-500">처리 대기</div>
                <div className="text-3xl font-extrabold text-amber-600 mt-2">
                  {stats.pendingCount}
                  <span className="text-xs font-normal text-stone-400 ml-1">건</span>
                </div>
              </div>
              <div className="rounded-[12px] bg-white p-5 border border-[#edebe9] shadow-xs">
                <div className="text-xs font-bold text-stone-500">
                  {role === '팀장' ? '승인 완료 (이번 달)' : '승인 완료'}
                </div>
                <div className="text-3xl font-extrabold text-[#00754A] mt-2">
                  {stats.approvedCount}
                  <span className="text-xs font-normal text-stone-400 ml-1">건</span>
                </div>
              </div>
              <div className="rounded-[12px] bg-white p-5 border border-[#edebe9] shadow-xs">
                <div className="text-xs font-bold text-stone-500">반려</div>
                <div className="text-3xl font-extrabold text-rose-600 mt-2">
                  {stats.rejectedCount}
                  <span className="text-xs font-normal text-stone-400 ml-1">건</span>
                </div>
              </div>
            </div>

            {/* 2.5) 부서 필터 바 (팀장 및 경리담당자 전용) */}
            {(role === '팀장' || role === '경리담당자') && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#faf6ee] p-3 rounded-xl border border-[#edebe9]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-extrabold text-[#1E3932] flex items-center gap-1.5 mr-1">
                    <Building2 className="h-4 w-4 text-[#00754A]" />
                    부서 필터:
                  </span>

                  {/* 전체 부서 버튼 */}
                  <button
                    type="button"
                    onClick={() => setRequestsDeptFilter('all')}
                    className={`btn-pill px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs flex items-center gap-1 ${
                      requestsDeptFilter === 'all'
                        ? 'bg-[#00754A] text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>전체 부서</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        requestsDeptFilter === 'all'
                          ? 'bg-white/20 text-white'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {requests.length}건
                    </span>
                  </button>

                  {/* 개별 부서 버튼 목록 */}
                  {departmentList.map((dept) => {
                    const isMyDept = memberInfo?.부서 === dept;
                    const isSelected = requestsDeptFilter === dept;
                    const deptCount = requests.filter(
                      (r) => (r.department || getMemberDepartment(r.email)) === dept
                    ).length;

                    return (
                      <button
                        key={dept}
                        type="button"
                        onClick={() => setRequestsDeptFilter(dept)}
                        className={`btn-pill px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#00754A] text-white shadow-xs'
                            : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span>{dept}</span>
                        {isMyDept && (
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isSelected
                                ? 'bg-white/25 text-white'
                                : 'bg-[#d4e9e2] text-[#00754A]'
                            }`}
                          >
                            내 부서
                          </span>
                        )}
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {deptCount}건
                        </span>
                      </button>
                    );
                  })}
                </div>

                {requestsDeptFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setRequestsDeptFilter('all')}
                    className="text-xs text-stone-500 hover:text-[#00754A] underline font-semibold ml-auto"
                  >
                    전체 보기로 전환
                  </button>
                )}
              </div>
            )}

            {/* 3) 필터 탭 네비게이션 */}
            <div className="border-b border-[#edebe9] flex items-center gap-6 pt-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => {
                const count =
                  tab === 'all'
                    ? requestsDeptFilteredList.length
                    : tab === 'pending'
                    ? stats.pendingCount
                    : tab === 'approved'
                    ? stats.approvedCount
                    : stats.rejectedCount;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilterTab(tab)}
                    className={`pb-3 text-xs font-bold transition-all relative flex items-center gap-1.5 ${
                      filterTab === tab
                        ? 'text-[#00754A]'
                        : 'text-stone-400 hover:text-stone-700'
                    }`}
                  >
                    <span>
                      {tab === 'all'
                        ? '전체'
                        : tab === 'pending'
                        ? '대기'
                        : tab === 'approved'
                        ? '승인'
                        : '반려'}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        filterTab === tab
                          ? 'bg-[#d4e9e2] text-[#00754A]'
                          : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      {count}
                    </span>
                    {filterTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00754A] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* 4) 카드형 신청 목록 */}
            {filteredRequests.length === 0 ? (
              <div className="rounded-[12px] bg-white border border-[#edebe9] p-10 text-center text-xs text-stone-400">
                해당 조건의 연차 신청 내역이 없습니다.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredRequests.map((req) => {
                  const applicantName = req.user_name || getMemberLabel(req.email);
                  const applicantDept = req.department || getMemberDepartment(req.email);
                  const initialChar = getAvatarChar(req.email);
                  const isPending = req.status === '대기';

                  return (
                    <div
                      key={req.id}
                      className="rounded-[12px] bg-white border border-[#edebe9] p-4 sm:p-5 shadow-xs hover:border-stone-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      {/* 좌측 정보 클러스터 */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-full bg-[#d4e9e2] text-[#1E3932] font-extrabold flex items-center justify-center text-sm flex-shrink-0 mt-0.5">
                          {initialChar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-sm text-[#1E3932]">
                              {applicantName}
                            </span>
                            <span className="text-xs text-stone-400">·</span>
                            <span className="text-sm font-semibold text-stone-800">
                              {req.reason}
                            </span>
                          </div>
                          <div className="text-xs text-stone-500 mt-1 flex items-center gap-2 flex-wrap">
                            <span>{formatDateRangeText(req.start_date, req.end_date)}</span>
                            {req.leave_type && (
                              <>
                                <span>·</span>
                                <span className="font-bold text-[#00754A]">{req.leave_type}</span>
                              </>
                            )}
                            {applicantDept && (
                              <>
                                <span>·</span>
                                <span>{applicantDept}</span>
                              </>
                            )}
                            <span>·</span>
                            <span className="font-mono text-[11px] text-stone-400">
                              {req.created_at ? req.created_at.split('T')[0] : ''}
                            </span>
                          </div>

                          {/* 반려 사유 표시 */}
                          {req.reject_reason && (
                            <div className="mt-2 rounded-lg bg-rose-50 border border-rose-200/60 p-2.5 text-xs text-rose-800">
                              <span className="font-bold">[반려 사유]</span> {req.reject_reason}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 우측 상태 & 액션 클러스터 */}
                      <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap">
                        {/* 상태 뱃지 */}
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            req.status === '승인'
                              ? 'bg-[#d4e9e2] text-[#00754A]'
                              : req.status === '반려'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {req.status}
                        </span>

                        {/* PDF 신청서 원본 확인 버튼 */}
                        {req.pdf_url && (
                          <button
                            type="button"
                            onClick={() => setPreviewDocRequest(req)}
                            className="btn-pill inline-flex items-center gap-1 rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-bold text-stone-700 hover:bg-stone-50 transition"
                            title="전자서명 연차신청서 원본 열람"
                          >
                            <FileText className="h-3 w-3 text-[#00754A]" />
                            <span>신청서 보기</span>
                          </button>
                        )}

                        {/* 팀장용 승인 / 반려 / 재전환 / 알림메일 액션 버튼 */}
                        {role === '팀장' && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* 1) 대기 상태: 승인 & 반려 */}
                            {req.status === '대기' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(req.id)}
                                  disabled={updatingId === req.id}
                                  className="btn-pill rounded-full bg-[#00754A] hover:bg-[#006241] px-3.5 py-1.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50"
                                >
                                  {updatingId === req.id ? '승인 중...' : '승인'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRejectingRequest(req)}
                                  disabled={updatingId === req.id}
                                  className="btn-pill rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 px-3.5 py-1.5 text-xs font-bold transition active:scale-95 disabled:opacity-50"
                                >
                                  반려
                                </button>
                              </>
                            )}

                            {/* 2) 승인 상태: 반려로 변경 & 승인 알림메일 발송 */}
                            {req.status === '승인' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setRejectingRequest(req)}
                                  disabled={updatingId === req.id}
                                  className="btn-pill rounded-full border border-rose-300 bg-white text-rose-700 hover:bg-rose-50 px-3 py-1.5 text-xs font-bold transition active:scale-95"
                                  title="승인된 연차를 반려 상태로 변경하고 사유를 입력합니다"
                                >
                                  반려로 변경
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSendApprovalEmail(req)}
                                  disabled={emailSendingId === req.id}
                                  className="btn-pill inline-flex items-center gap-1 rounded-full border border-[#00754A] bg-[#00754A]/10 text-[#00754A] hover:bg-[#00754A]/20 px-3 py-1.5 text-xs font-bold transition active:scale-95"
                                  title="사원에게 승인 알림 이메일을 전송합니다"
                                >
                                  {emailSendingId === req.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Mail className="h-3 w-3" />
                                  )}
                                  <span>알림메일</span>
                                </button>
                              </>
                            )}

                            {/* 3) 반려 상태: 승인으로 변경(재승인) & 반려 알림메일 발송 */}
                            {req.status === '반려' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprove(req.id)}
                                  disabled={updatingId === req.id}
                                  className="btn-pill rounded-full bg-[#00754A] hover:bg-[#006241] px-3.5 py-1.5 text-xs font-bold text-white transition active:scale-95 disabled:opacity-50"
                                  title="반려된 연차를 다시 승인하고 팀장 승인 도장을 날인합니다"
                                >
                                  {updatingId === req.id ? '승인 중...' : '승인으로 변경'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSendRejectionEmail(req)}
                                  disabled={emailSendingId === req.id}
                                  className="btn-pill inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 text-xs font-bold transition active:scale-95"
                                  title="사원에게 반려 안내 이메일을 재전송합니다"
                                >
                                  {emailSendingId === req.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Mail className="h-3 w-3" />
                                  )}
                                  <span>반려메일</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedRequest(req)}
                          className="btn-pill rounded-full border border-stone-200 px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition"
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

        {/* ==================================================== */}
        {/* 탭 3: 팀장 전용 일정 (달력) 탭 */}
        {/* ==================================================== */}
        {activeNavTab === 'calendar' && role === '팀장' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E3932]">
                연차 일정 (달력)
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                동일인 중복/연속 신청 내역을 통합 블록으로 확인하며, 승인(초록)·대기(노랑)·반려(빨강) 및 반차를 직관적으로 파악합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
              {/* 메인 달력 (3열) */}
              <div className="rounded-[12px] border border-[#edebe9] bg-white p-6 xl:col-span-3 shadow-xs">
                {/* 달력 상단 네비게이션 & 범례 */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#edebe9] pb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-extrabold text-[#1E3932]">
                      {calendarDate.getFullYear()}년 {calendarDate.getMonth() + 1}월
                    </h3>
                    <div className="flex items-center rounded-full border border-stone-300 bg-white shadow-2xs overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setCalendarDate(
                            new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1)
                          )
                        }
                        className="p-1.5 text-stone-600 hover:bg-stone-100 transition"
                        title="이전 달"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarDate(new Date())}
                        className="px-3 py-1 text-xs font-bold text-stone-800 hover:bg-stone-100 border-x border-stone-200 transition"
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
                        className="p-1.5 text-stone-600 hover:bg-stone-100 transition"
                        title="다음 달"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* PRD 2.1 상태별 컬러 코딩 범례 */}
                  <div className="flex items-center gap-3 text-xs font-semibold flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-[#00754A]" />
                      <span className="text-[#00754A]">승인 완료 (초록색)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-amber-400" />
                      <span className="text-amber-800">승인 대기 (노란색)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-3 w-3 rounded-full bg-rose-500" />
                      <span className="text-rose-700">반려 (빨간색)</span>
                    </div>
                  </div>
                </div>

                {/* 1.5. 부서별 필터링 탭 바 */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 bg-[#faf6ee] p-3 rounded-xl border border-[#edebe9]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-extrabold text-[#1E3932] flex items-center gap-1.5 mr-1">
                      <Building2 className="h-4 w-4 text-[#00754A]" />
                      부서 필터:
                    </span>

                    {/* 전체보기 버튼 */}
                    <button
                      type="button"
                      onClick={() => setCalendarDeptFilter('all')}
                      className={`btn-pill px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs flex items-center gap-1 ${
                        calendarDeptFilter === 'all'
                          ? 'bg-[#00754A] text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      <span>전체 부서</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          calendarDeptFilter === 'all'
                            ? 'bg-white/20 text-white'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {requests.length}건
                      </span>
                    </button>

                    {/* 개별 부서 버튼 목록 */}
                    {departmentList.map((dept) => {
                      const isMyDept = memberInfo?.부서 === dept;
                      const isSelected = calendarDeptFilter === dept;
                      const deptCount = requests.filter(
                        (r) => (r.department || getMemberDepartment(r.email)) === dept
                      ).length;

                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => setCalendarDeptFilter(dept)}
                          className={`btn-pill px-3 py-1.5 rounded-full text-xs font-bold transition shadow-2xs flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-[#00754A] text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <span>{dept}</span>
                          {isMyDept && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                isSelected
                                  ? 'bg-white/25 text-white'
                                  : 'bg-[#d4e9e2] text-[#00754A]'
                              }`}
                            >
                              내 부서
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-stone-100 text-stone-500'
                            }`}
                          >
                            {deptCount}건
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {calendarDeptFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setCalendarDeptFilter('all')}
                      className="text-xs text-stone-500 hover:text-[#00754A] underline font-semibold ml-auto"
                    >
                      전체 보기로 전환
                    </button>
                  )}
                </div>

                {/* 달력 그리드 */}
                <div className="overflow-hidden rounded-xl border border-stone-200 bg-white">
                  {/* 요일 헤더 */}
                  <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-center text-xs font-bold text-stone-700">
                    <div className="py-2.5 text-[#c82014]">일</div>
                    <div className="py-2.5">월</div>
                    <div className="py-2.5">화</div>
                    <div className="py-2.5">수</div>
                    <div className="py-2.5">목</div>
                    <div className="py-2.5">금</div>
                    <div className="py-2.5 text-[#00754A]">토</div>
                  </div>

                  {/* 일자 셀 그리드 */}
                  <div className="grid grid-cols-7 divide-x divide-y divide-stone-200">
                    {calendarDays.map((day, idx) => {
                      const mergedLeaves = getMergedDayLeaves(day.dateStr);

                      return (
                        <div
                          key={idx}
                          className={`min-h-[115px] p-2 transition flex flex-col justify-between ${
                            !day.isCurrentMonth
                              ? 'bg-stone-50/50 text-stone-300'
                              : 'bg-white hover:bg-stone-50/70'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-xs font-bold inline-flex h-6 w-6 items-center justify-center rounded-full ${
                                day.isToday
                                  ? 'bg-[#00754A] text-white shadow-xs'
                                  : !day.isCurrentMonth
                                  ? 'text-stone-300'
                                  : idx % 7 === 0
                                  ? 'text-[#c82014]'
                                  : idx % 7 === 6
                                  ? 'text-[#00754A]'
                                  : 'text-stone-800'
                              }`}
                            >
                              {day.dayNumber}
                            </span>
                            {mergedLeaves.length > 0 && day.isCurrentMonth && (
                              <span className="text-[10px] font-bold text-stone-400">
                                {mergedLeaves.length}명
                              </span>
                            )}
                          </div>

                          {/* 동일인 중복/연속 신청 통합 블록 렌더링 */}
                          <div className="space-y-1 overflow-y-auto max-h-[85px]">
                            {mergedLeaves.map((block, bIdx) => {
                              const isApproved = block.mergedStatus === '승인';
                              const isPending = block.mergedStatus === '대기';

                              return (
                                <button
                                  key={bIdx}
                                  type="button"
                                  onClick={() =>
                                    setMergedModalRequests({
                                      dateStr: day.dateStr,
                                      userName: block.userName,
                                      email: block.email,
                                      department: block.department,
                                      requests: block.requests,
                                    })
                                  }
                                  className={`w-full text-left truncate rounded-md px-1.5 py-1 text-[11px] font-bold transition shadow-2xs flex items-center justify-between gap-1 ${
                                    isApproved
                                      ? 'bg-[#d4e9e2] text-[#00754A] border border-[#00754A]/30 hover:bg-[#c2e2d8]'
                                      : isPending
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                      : 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                                  }`}
                                  title={`${block.displayLabel} (클릭하여 상세 확인)`}
                                >
                                  <span className="truncate block">
                                    {isApproved ? '🟢 ' : isPending ? '🟡 ' : '🔴 '}
                                    {block.displayLabel}
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

              {/* 우측 사이드바: 반려 목록 독립 패널 */}
              <div className="rounded-[12px] border border-rose-200 bg-white p-5 xl:col-span-1 shadow-xs">
                <div className="mb-3 flex items-center justify-between border-b border-stone-200 pb-3">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-[#c82014]" />
                    <h4 className="text-xs font-bold text-stone-900">
                      {calendarDeptFilter === 'all'
                        ? '반려 내역 (전체)'
                        : `${calendarDeptFilter} 반려 내역`}
                    </h4>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700">
                    {rejectedRequests.length}건
                  </span>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto">
                  {rejectedRequests.length === 0 ? (
                    <div className="p-4 text-center text-xs text-stone-400">
                      반려된 신청이 없습니다.
                    </div>
                  ) : (
                    rejectedRequests.map((r) => (
                      <div
                        key={r.id}
                        className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-xs space-y-1.5"
                      >
                        <div className="flex justify-between items-center font-bold text-stone-900">
                          <span>{r.user_name || getMemberLabel(r.email)}</span>
                          <span className="text-[11px] text-stone-500 font-normal">
                            {r.department || getMemberDepartment(r.email)}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-600 font-mono">
                          {r.start_date} ~ {r.end_date}
                        </div>
                        <div className="text-[11px] text-stone-600">
                          <strong>신청:</strong> {r.reason}
                        </div>
                        {r.reject_reason && (
                          <div className="rounded bg-rose-50 p-1.5 text-[11px] text-rose-800 font-medium">
                            <strong>반려사유:</strong> {r.reject_reason}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedRequest(r)}
                          className="w-full mt-1 rounded-md border border-stone-200 bg-white py-1 text-[11px] font-semibold text-stone-700 hover:bg-stone-100 transition"
                        >
                          상세 보기
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* C. 모달 레이어들 */}
      {/* ======================================================== */}

      {/* 1. 실시간 미리보기 + 전자서명 연차 신청 모달 */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-5 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-5xl rounded-[16px] bg-[#f2f0eb] p-5 sm:p-7 shadow-2xl border border-stone-200 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between border-b border-stone-300 pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                <CalendarRange className="h-5 w-5 text-[#00754A]" />
                <div>
                  <h3 className="text-lg font-extrabold text-[#1E3932]">새 연차 신청서 작성</h3>
                  <p className="text-[11px] text-stone-500">
                    실시간 신청서 미리보기를 확인하고 전자서명을 완료하여 제출하세요
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-800 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* 2-컬럼 레이아웃: 좌측(입력폼 & 서명패드) + 우측(실시간 A4 미리보기) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 좌측: 입력 폼 & 전자서명 패드 */}
              <form onSubmit={handleSubmitLeave} className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
                  {/* 휴가 구분 선택 */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1.5">
                      휴가 구분 <span className="text-[#c82014]">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['종일', '오전반차', '오후반차'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => {
                            setLeaveType(type);
                            if (type.includes('반차') && startDate) {
                              setEndDate(startDate);
                            }
                          }}
                          className={`py-2 text-xs font-bold rounded-xl border transition ${
                            leaveType === type
                              ? 'bg-[#00754A] text-white border-[#00754A]'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 날짜 선택 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        시작일 <span className="text-[#c82014]">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (leaveType.includes('반차')) {
                            setEndDate(e.target.value);
                          }
                        }}
                        className="w-full rounded-xl border border-stone-300 p-2 text-xs outline-none focus:border-[#00754A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        종료일 <span className="text-[#c82014]">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        disabled={leaveType.includes('반차')}
                        value={leaveType.includes('반차') ? startDate : endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-xl border border-stone-300 p-2 text-xs outline-none focus:border-[#00754A] disabled:bg-stone-100 disabled:text-stone-400"
                      />
                    </div>
                  </div>

                  {/* 사유 입력 */}
                  <div>
                    <label className="block text-xs font-bold text-stone-800 mb-1">
                      신청 사유 <span className="text-[#c82014]">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="예: 개인 사유, 정기 휴가, 병원 진료 등"
                      className="w-full rounded-xl border border-stone-300 p-2.5 text-xs outline-none focus:border-[#00754A] transition"
                    />
                  </div>

                  {/* 전자서명 패드 (PRD 2.3) */}
                  <div className="pt-2 border-t border-stone-100">
                    <SignaturePad
                      onChange={(dataUrl) => setSignatureDataUrl(dataUrl)}
                      height={120}
                    />
                  </div>
                </div>

                {/* 하단 제출 버튼 */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="btn-pill rounded-full border border-stone-300 bg-white px-5 py-2.5 text-xs font-bold text-stone-700 hover:bg-stone-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading || !signatureDataUrl}
                    className="btn-pill flex items-center gap-2 rounded-full bg-[#00754A] hover:bg-[#006241] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-40"
                    title={!signatureDataUrl ? '전자서명을 완료해야 제출할 수 있습니다' : ''}
                  >
                    {submitLoading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>PDF 생성 및 보관 중...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>신청서 PDF 생성 및 제출</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* 우측: 실시간 연차신청서 양식 미리보기 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-stone-600 px-1">
                  <span>실시간 연차신청서 미리보기 (A4 PDF 변환 대상)</span>
                  <span className="text-[11px] text-[#00754A]">실시간 데이터 연동 중</span>
                </div>
                <div className="bg-stone-200/50 p-3 rounded-2xl border border-stone-300 flex items-center justify-center">
                  <LeaveDocumentPreview
                    ref={documentPrintRef}
                    userName={memberInfo?.이름 || user?.email?.split('@')[0] || ''}
                    department={memberInfo?.부서 || '부서미지정'}
                    email={user?.email || ''}
                    startDate={startDate}
                    endDate={leaveType.includes('반차') ? startDate : endDate}
                    leaveType={leaveType}
                    reason={reason}
                    signatureDataUrl={signatureDataUrl}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. 팀장용 반려 사유 입력 모달 (PRD 2.2) */}
      <RejectReasonModal
        isOpen={!!rejectingRequest}
        applicantName={
          rejectingRequest
            ? rejectingRequest.user_name || getMemberLabel(rejectingRequest.email)
            : ''
        }
        applicantEmail={rejectingRequest ? rejectingRequest.email : ''}
        department={
          rejectingRequest
            ? rejectingRequest.department || getMemberDepartment(rejectingRequest.email)
            : ''
        }
        startDate={rejectingRequest ? rejectingRequest.start_date : ''}
        endDate={rejectingRequest ? rejectingRequest.end_date : ''}
        leaveReason={rejectingRequest ? rejectingRequest.reason : ''}
        onClose={() => setRejectingRequest(null)}
        onConfirm={handleConfirmRejectionWithEmail}
      />

      {/* 2-1. 정식 연차유급휴가신청서 원본 인앱 뷰어 모달 */}
      {previewDocRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-[620px] max-h-[95vh] overflow-y-auto rounded-3xl bg-stone-100 p-5 shadow-2xl border border-stone-300">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-300">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00754A]/10 text-[#00754A]">
                  <FileText className="h-4 w-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#1E3932]">
                    연차유급휴가신청서 (전자문서 원본)
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    신청일: {previewDocRequest.created_at.split('T')[0].split(' ')[0]} · 상태: {previewDocRequest.status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocRequest(null)}
                className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* 실제 정식 서식 미리보기 */}
            <div className="bg-white p-3 rounded-2xl shadow-inner border border-stone-300 flex justify-center">
              <LeaveDocumentPreview
                userName={previewDocRequest.user_name || getMemberLabel(previewDocRequest.email)}
                department={previewDocRequest.department || getMemberDepartment(previewDocRequest.email)}
                email={previewDocRequest.email}
                startDate={previewDocRequest.start_date}
                endDate={previewDocRequest.end_date}
                leaveType={previewDocRequest.leave_type || '종일'}
                reason={previewDocRequest.reason}
                signatureDataUrl={previewDocRequest.signature_data || null}
                applicationDate={previewDocRequest.created_at.split('T')[0].split(' ')[0]}
                status={previewDocRequest.status}
                rejectReason={previewDocRequest.reject_reason}
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
                {previewDocRequest.pdf_url && (
                  <a
                    href={`${previewDocRequest.pdf_url}?t=${Date.now()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-pill inline-flex items-center gap-1.5 rounded-full bg-[#00754A] hover:bg-[#006241] px-4 py-2 text-xs font-bold text-white shadow-xs transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>PDF 다운로드 / 새 창</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewDocRequest(null)}
                  className="btn-pill rounded-full bg-stone-300 hover:bg-stone-400 px-5 py-2 text-xs font-bold text-stone-800 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2-2. 팀장 승인 시 사원 서명 + 팀장 승인 도장 통합 A4 PDF 자동 생성용 히든 렌더러 */}
      {approvingRequest && (
        <div
          style={{
            position: 'fixed',
            left: -9999,
            top: -9999,
            width: 794,
            opacity: 0,
            pointerEvents: 'none',
            zIndex: -100,
          }}
        >
          <LeaveDocumentPreview
            ref={approvalDocRef}
            userName={approvingRequest.user_name || getMemberLabel(approvingRequest.email)}
            department={approvingRequest.department || getMemberDepartment(approvingRequest.email)}
            email={approvingRequest.email}
            startDate={approvingRequest.start_date}
            endDate={approvingRequest.end_date}
            leaveType={approvingRequest.leave_type || '종일'}
            reason={approvingRequest.reason}
            signatureDataUrl={approvingRequest.signature_data || null}
            applicationDate={approvingRequest.created_at.split('T')[0].split(' ')[0]}
            status="승인"
          />
        </div>
      )}

      {/* 3. 달력 병합 블록 상세 모달 */}
      {mergedModalRequests && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-[#1E3932]">
                  {mergedModalRequests.userName} 사원 연차 일정
                </h3>
                <p className="text-xs text-stone-500">
                  {mergedModalRequests.dateStr} · {mergedModalRequests.department}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMergedModalRequests(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {mergedModalRequests.requests.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-stone-200 bg-stone-50 p-3.5 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900">
                      {r.leave_type || '종일'} ({r.start_date} ~ {r.end_date})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        r.status === '승인'
                          ? 'bg-[#d4e9e2] text-[#00754A]'
                          : r.status === '반려'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  <div className="text-stone-700">
                    <strong>사유:</strong> {r.reason}
                  </div>
                  {r.reject_reason && (
                    <div className="text-rose-700 bg-rose-50 p-2 rounded">
                      <strong>반려사유:</strong> {r.reject_reason}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                    {r.pdf_url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewDocRequest(r)}
                        className="text-[11px] font-bold text-[#00754A] hover:underline flex items-center gap-1"
                      >
                        <FileText className="h-3 w-3" />
                        연차신청서 원본 보기
                      </button>
                    ) : (
                      <span className="text-[10px] text-stone-400">PDF 미생성</span>
                    )}

                    {role === '팀장' && (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {r.status === '대기' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id)}
                              disabled={updatingId === r.id}
                              className="px-3 py-1 rounded-full bg-[#00754A] text-white font-bold text-[11px]"
                            >
                              승인
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectingRequest(r)}
                              disabled={updatingId === r.id}
                              className="px-3 py-1 rounded-full border border-rose-300 text-rose-700 font-bold text-[11px]"
                            >
                              반려
                            </button>
                          </>
                        )}
                        {r.status === '승인' && (
                          <>
                            <button
                              type="button"
                              onClick={() => setRejectingRequest(r)}
                              disabled={updatingId === r.id}
                              className="px-2.5 py-1 rounded-full border border-rose-300 text-rose-700 font-bold text-[11px] bg-white hover:bg-rose-50"
                              title="승인된 연차를 반려 상태로 변경하고 사유를 입력합니다"
                            >
                              반려로 변경
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendApprovalEmail(r)}
                              disabled={emailSendingId === r.id}
                              className="px-2.5 py-1 rounded-full border border-[#00754A] text-[#00754A] font-bold text-[11px] bg-[#00754A]/10 inline-flex items-center gap-1"
                              title="사원에게 승인 알림 메일을 전송합니다"
                            >
                              {emailSendingId === r.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Mail className="h-3 w-3" />
                              )}
                              <span>알림메일</span>
                            </button>
                          </>
                        )}
                        {r.status === '반려' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApprove(r.id)}
                              disabled={updatingId === r.id}
                              className="px-2.5 py-1 rounded-full bg-[#00754A] text-white font-bold text-[11px]"
                              title="반려된 연차를 다시 승인하고 팀장 승인 도장을 날인합니다"
                            >
                              승인으로 변경
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendRejectionEmail(r)}
                              disabled={emailSendingId === r.id}
                              className="px-2.5 py-1 rounded-full border border-rose-300 text-rose-700 font-bold text-[11px] bg-rose-50 inline-flex items-center gap-1"
                              title="사원에게 반려 안내 메일을 재전송합니다"
                            >
                              {emailSendingId === r.id ? (
                                <RefreshCw className="h-3 w-3 animate-spin" />
                              ) : (
                                <Mail className="h-3 w-3" />
                              )}
                              <span>반려메일</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. 비밀번호 변경 모달 */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-[16px] bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[#00754A]" />
                <h3 className="text-sm font-bold text-[#1E3932]">비밀번호 변경</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            {changePasswordError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs">
                {changePasswordError}
              </div>
            )}
            {changePasswordSuccess && (
              <div className="mb-3 p-2.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs">
                {changePasswordSuccess}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">새 비밀번호</label>
                <input
                  type="password"
                  required
                  value={changePasswordInput}
                  onChange={(e) => setChangePasswordInput(e.target.value)}
                  placeholder="6자 이상 입력"
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs outline-none focus:border-[#00754A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  required
                  value={changePasswordConfirm}
                  onChange={(e) => setChangePasswordConfirm(e.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-xs outline-none focus:border-[#00754A]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="btn-pill rounded-full border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700 hover:bg-stone-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={changePasswordLoading}
                  className="btn-pill rounded-full bg-[#00754A] hover:bg-[#006241] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {changePasswordLoading ? '변경 중...' : '변경 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. 연차 상세 정보 모달 */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[16px] bg-white p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[#00754A]" />
                <h3 className="text-sm font-bold text-[#1E3932]">연차 상세 정보</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-stone-800">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500 font-semibold">신청자</span>
                <span className="font-bold text-stone-900">
                  {selectedRequest.user_name || getMemberLabel(selectedRequest.email)}{' '}
                  {selectedRequest.department ? `(${selectedRequest.department})` : ''}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500 font-semibold">이메일 계정</span>
                <span className="font-mono text-stone-700">{selectedRequest.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500 font-semibold">휴가 구분 / 기간</span>
                <span className="font-bold text-stone-900">
                  {selectedRequest.leave_type || '종일'} ({selectedRequest.start_date} ~{' '}
                  {selectedRequest.end_date})
                </span>
              </div>
              <div className="py-1 border-b border-stone-100">
                <span className="block text-stone-500 font-semibold mb-1">신청 사유</span>
                <p className="rounded-lg bg-stone-50 p-2.5 text-stone-800 break-words">
                  {selectedRequest.reason}
                </p>
              </div>

              {selectedRequest.reject_reason && (
                <div className="py-1 border-b border-stone-100">
                  <span className="block text-rose-600 font-semibold mb-1">반려 사유</span>
                  <p className="rounded-lg bg-rose-50 p-2.5 text-rose-800 break-words font-medium">
                    {selectedRequest.reject_reason}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center py-1">
                <span className="text-stone-500 font-semibold">결재 상태</span>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                    selectedRequest.status === '승인'
                      ? 'bg-[#d4e9e2] text-[#00754A]'
                      : selectedRequest.status === '반려'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {selectedRequest.status}
                </span>
              </div>

              {selectedRequest.pdf_url && (
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDocRequest(selectedRequest)}
                    className="btn-pill flex-1 flex items-center justify-center gap-1.5 rounded-full bg-white border border-stone-300 hover:bg-stone-50 py-2 text-xs font-bold text-stone-800 transition shadow-xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#00754A]" />
                    <span>신청서 양식 보기</span>
                  </button>
                  <a
                    href={`${selectedRequest.pdf_url}?t=${Date.now()}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-pill flex-1 flex items-center justify-center gap-1.5 rounded-full bg-[#1E3932] hover:bg-[#00754A] py-2 text-xs font-bold text-white transition shadow-xs"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>PDF 다운로드</span>
                  </a>
                </div>
              )}
            </div>

            {role === '팀장' && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-stone-200 mt-4">
                <div className="text-xs text-stone-500 font-medium">
                  {selectedRequest.status === '대기' && '결재 대기 중인 신청서입니다.'}
                  {selectedRequest.status === '승인' && '승인 완료된 신청서입니다. 필요 시 반려로 변경하거나 알림메일을 발송할 수 있습니다.'}
                  {selectedRequest.status === '반려' && '반려 처리된 신청서입니다. 필요 시 다시 승인 처리할 수 있습니다.'}
                </div>
                <div className="flex items-center gap-2">
                  {selectedRequest.status === '대기' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRejectingRequest(selectedRequest)}
                        className="btn-pill rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 px-4 py-2 text-xs font-bold"
                      >
                        반려 사유 입력
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === selectedRequest.id}
                        onClick={() => handleApprove(selectedRequest.id)}
                        className="btn-pill rounded-full bg-[#00754A] hover:bg-[#006241] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {updatingId === selectedRequest.id ? '도장 날인 중...' : '승인 처리'}
                      </button>
                    </>
                  )}
                  {selectedRequest.status === '승인' && (
                    <>
                      <button
                        type="button"
                        disabled={emailSendingId === selectedRequest.id}
                        onClick={() => handleSendApprovalEmail(selectedRequest)}
                        className="btn-pill flex items-center gap-1.5 rounded-full border border-emerald-300 text-[#00754A] hover:bg-emerald-50 px-3.5 py-2 text-xs font-bold disabled:opacity-50"
                        title="승인 알림 메일 발송"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>{emailSendingId === selectedRequest.id ? '발송 중...' : '승인 알림메일'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingRequest(selectedRequest)}
                        className="btn-pill rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 px-4 py-2 text-xs font-bold"
                      >
                        반려로 변경
                      </button>
                    </>
                  )}
                  {selectedRequest.status === '반려' && (
                    <>
                      <button
                        type="button"
                        disabled={emailSendingId === selectedRequest.id}
                        onClick={() => handleSendRejectionEmail(selectedRequest)}
                        className="btn-pill flex items-center gap-1.5 rounded-full border border-rose-300 text-rose-700 hover:bg-rose-50 px-3.5 py-2 text-xs font-bold disabled:opacity-50"
                        title="반려 알림 메일 재전송"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span>{emailSendingId === selectedRequest.id ? '발송 중...' : '반려 메일 재발송'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={updatingId === selectedRequest.id}
                        onClick={() => handleApprove(selectedRequest.id)}
                        className="btn-pill rounded-full bg-[#00754A] hover:bg-[#006241] px-5 py-2 text-xs font-bold text-white disabled:opacity-50"
                      >
                        {updatingId === selectedRequest.id ? '도장 날인 중...' : '승인으로 변경 (도장 날인)'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
