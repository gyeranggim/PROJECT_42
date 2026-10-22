import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

interface EmailPayload {
  to: string;
  type: 'approval' | 'rejection' | 'promotion';
  subject?: string;
  data: {
    userName?: string;
    department?: string;
    startDate?: string;
    endDate?: string;
    leaveType?: string;
    reason?: string;
    rejectReason?: string;
    hireDate?: string;
    totalLeave?: number;
    usedLeave?: number;
    remainingLeave?: number;
    deadline?: string;
    pdfUrl?: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: EmailPayload = await request.json();
    const { to, type, data } = body;

    if (!to || !type) {
      return NextResponse.json(
        { error: '수신자 이메일과 메일 타입이 필요합니다.' },
        { status: 400 }
      );
    }

    let subject = body.subject;
    let htmlContent = '';

    if (type === 'approval') {
      subject =
        subject ||
        `[연차 신청 승인 안내] ${data.userName || '사원'}님의 연차 신청이 승인되었습니다.`;

      htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; background-color: #f2f0eb; padding: 32px; border-radius: 16px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #edebe9; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <div style="border-bottom: 2px solid #00754A; padding-bottom: 16px; margin-bottom: 20px;">
              <span style="display: inline-block; background-color: #d4e9e2; color: #00754A; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px;">결재 승인 완료</span>
              <h2 style="color: #1E3932; margin: 0; font-size: 20px; font-weight: 700;">연차유급휴가 신청 승인 안내</h2>
            </div>
            <p style="color: rgba(0,0,0,0.87); font-size: 15px; line-height: 1.6;">
              안녕하세요, <strong>${data.userName || '사원'}</strong>님.<br/>
              제출하신 연차 신청서가 소속 팀장의 검토를 거쳐 <strong>최종 승인</strong>되었음을 알려드립니다.
            </p>
            <div style="background-color: #f0fdf4; border-left: 4px solid #00754A; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <div style="font-size: 13px; font-weight: 700; color: #00754A; margin-bottom: 4px;">[결재 상태]</div>
              <div style="font-size: 14px; color: #166534; font-weight: 600;">승인 완료 (팀장 결재 직인 날인됨)</div>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0;">
              <tbody>
                <tr style="border-bottom: 1px solid #edebe9;">
                  <td style="padding: 10px; color: rgba(0,0,0,0.58); width: 30%;">휴가 구분</td>
                  <td style="padding: 10px; color: #00754A; font-weight: 700;">${data.leaveType || '종일'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edebe9;">
                  <td style="padding: 10px; color: rgba(0,0,0,0.58);">휴가 기간</td>
                  <td style="padding: 10px; color: rgba(0,0,0,0.87); font-weight: 600;">${data.startDate} ~ ${data.endDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edebe9;">
                  <td style="padding: 10px; color: rgba(0,0,0,0.58);">신청 사유</td>
                  <td style="padding: 10px; color: rgba(0,0,0,0.87);">${data.reason || '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edebe9;">
                  <td style="padding: 10px; color: rgba(0,0,0,0.58);">소속 부서</td>
                  <td style="padding: 10px; color: rgba(0,0,0,0.87);">${data.department || '-'}</td>
                </tr>
              </tbody>
            </table>
            ${data.pdfUrl ? `
              <div style="margin-top: 24px; text-align: center;">
                <a href="${data.pdfUrl}" target="_blank" style="display: inline-block; background-color: #00754A; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 10px 24px; border-radius: 9999px;">
                  전자결재 승인 신청서 PDF 확인
                </a>
              </div>
            ` : ''}
            <p style="color: rgba(0,0,0,0.58); font-size: 13px; margin-top: 24px; line-height: 1.5;">
              승인된 연차 내역은 캘린더 및 전사 연차 대시보드에 즉시 반영되었습니다. 즐거운 휴가 되시기 바랍니다.
            </p>
          </div>
          <div style="text-align: center; margin-top: 16px; font-size: 12px; color: rgba(0,0,0,0.40);">
            본 메일은 연차 관리 시스템에서 팀장 결재 완료 시 자동 발송되었습니다.
          </div>
        </div>
      `;
    } else if (type === 'rejection') {
      subject =
        subject ||
        `[연차 신청 반려 안내] ${data.userName || '사원'}님의 연차 신청이 반려되었습니다.`;

      htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; background-color: #f2f0eb; padding: 32px; border-radius: 16px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #edebe9; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <div style="border-bottom: 2px solid #1E3932; padding-bottom: 16px; margin-bottom: 20px;">
              <span style="display: inline-block; background-color: #fee2e2; color: #dc2626; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px;">반려 안내</span>
              <h2 style="color: #1E3932; margin: 0; font-size: 20px; font-weight: 700;">연차 신청 결과 안내</h2>
            </div>
            <p style="color: rgba(0,0,0,0.87); font-size: 15px; line-height: 1.6;">
              안녕하세요, <strong>${data.userName || '사원'}</strong>님.<br/>
              제출하신 연차 신청서가 팀장 검토 결과 아래와 같은 사유로 <strong>반려</strong>되었음을 알려드립니다.
            </p>
            <div style="background-color: #faf6ee; border-left: 4px solid #dc2626; padding: 16px; border-radius: 6px; margin: 20px 0;">
              <div style="font-size: 13px; font-weight: 700; color: #dc2626; margin-bottom: 6px;">[반려 사유]</div>
              <div style="font-size: 14px; color: rgba(0,0,0,0.87); white-space: pre-line;">${data.rejectReason || '사유가 명시되지 않았습니다.'}</div>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 20px 0;">
              <tbody>
                <tr style="border-bottom: 1px solid #edebe9;">
                  <td style="padding: 10px; color: rgba(0,0,0,0.58); width: 30%;">신청 기간</td>
                  <td style="padding: 10px; color: rgba(0,0,0,0.87); font-weight: 600;">${data.startDate} ~ ${data.endDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edebe9;">
                  <td style="padding: 10px; color: rgba(0,0,0,0.58);">신청 사유</td>
                  <td style="padding: 10px; color: rgba(0,0,0,0.87);">${data.reason || '-'}</td>
                </tr>
                <tr style="border-bottom: 1px solid #edebe9;">
                  <td style="padding: 10px; color: rgba(0,0,0,0.58);">소속 부서</td>
                  <td style="padding: 10px; color: rgba(0,0,0,0.87);">${data.department || '-'}</td>
                </tr>
              </tbody>
            </table>
            <p style="color: rgba(0,0,0,0.58); font-size: 13px; margin-top: 24px; line-height: 1.5;">
              문의사항이 있으신 경우 소속 팀장에게 문의하시거나, 사유를 보완하여 재신청해 주시기 바랍니다.
            </p>
          </div>
          <div style="text-align: center; margin-top: 16px; font-size: 12px; color: rgba(0,0,0,0.40);">
            본 메일은 연차 관리 시스템에서 자동 발송되었습니다.
          </div>
        </div>
      `;
    } else if (type === 'promotion') {
      subject =
        subject ||
        `[연차유급휴가 사용 촉진 통보] ${data.userName || '사원'}님 미사용 연차유급휴가 사용 계획 안내`;

      htmlContent = `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Pretendard', sans-serif; background-color: #f2f0eb; padding: 32px; border-radius: 16px;">
          <div style="background-color: #ffffff; border-radius: 12px; padding: 28px; border: 1px solid #edebe9; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <div style="border-bottom: 2px solid #00754A; padding-bottom: 16px; margin-bottom: 20px;">
              <span style="display: inline-block; background-color: #d4e9e2; color: #00754A; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; margin-bottom: 8px;">근로기준법 제61조 준수</span>
              <h2 style="color: #1E3932; margin: 0; font-size: 20px; font-weight: 700;">미사용 연차유급휴가 사용 촉진 통보서</h2>
            </div>
            <p style="color: rgba(0,0,0,0.87); font-size: 15px; line-height: 1.6;">
              <strong>${data.userName || '사원'}</strong> 귀하 (${data.department || '임직원'})<br/><br/>
              근로기준법 제61조(연차유급휴가의 사용촉진) 규정에 의거하여, 귀하의 미사용 연차유급휴가 일수를 알려드리오니, 지정 기한 내에 휴가 사용 계획을 확정하여 주시기 바랍니다.
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 24px 0; border: 1px solid #edebe9;">
              <thead>
                <tr style="background-color: #faf6ee; border-bottom: 1px solid #edebe9;">
                  <th style="padding: 10px; text-align: center; color: #1E3932;">입사일</th>
                  <th style="padding: 10px; text-align: center; color: #1E3932;">총 발생일수</th>
                  <th style="padding: 10px; text-align: center; color: #1E3932;">기 사용일수</th>
                  <th style="padding: 10px; text-align: center; color: #00754A; font-weight: 700;">미사용(잔여)일수</th>
                </tr>
              </thead>
              <tbody>
                <tr style="text-align: center; background-color: #ffffff;">
                  <td style="padding: 12px; border-right: 1px solid #edebe9;">${data.hireDate || '-'}</td>
                  <td style="padding: 12px; border-right: 1px solid #edebe9;">${data.totalLeave ?? 15}일</td>
                  <td style="padding: 12px; border-right: 1px solid #edebe9;">${data.usedLeave ?? 0}일</td>
                  <td style="padding: 12px; color: #00754A; font-weight: 700; font-size: 16px;">${data.remainingLeave ?? 15}일</td>
                </tr>
              </tbody>
            </table>
            <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px; font-size: 13px; color: rgba(0,0,0,0.70); line-height: 1.6;">
              <strong>■ 사용 계획서 제출 안내</strong><br/>
              - 제출 기한: <strong>${data.deadline || '통보를 받은 날로부터 10일 이내'}</strong><br/>
              - 본 촉진 조치에도 불구하고 사용 계획을 제출하지 않거나 휴가를 사용하지 않을 경우, 근로기준법 제61조에 따라 미사용 연차에 대한 금전보상 의무가 면제될 수 있습니다.
            </div>
            <p style="color: rgba(0,0,0,0.58); font-size: 13px; margin-top: 20px; text-align: right;">
              인사경리팀 배상
            </p>
          </div>
          <div style="text-align: center; margin-top: 16px; font-size: 12px; color: rgba(0,0,0,0.40);">
            본 메일은 연차 관리 시스템에서 인사경리 담당자에 의해 발송되었습니다.
          </div>
        </div>
      `;
    }

    // SMTP 환경 변수 확인
    const smtpUser = process.env.SMTP_USER;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const isGmail =
      Boolean(smtpUser?.includes('@gmail.com')) ||
      Boolean(process.env.SMTP_HOST?.includes('gmail'));
    const isNaver =
      Boolean(smtpUser?.includes('@naver.com')) ||
      Boolean(process.env.SMTP_HOST?.includes('naver'));

    const smtpHost =
      process.env.SMTP_HOST ||
      (isNaver ? 'smtp.naver.com' : 'smtp.gmail.com');
    const smtpPort = process.env.SMTP_PORT
      ? parseInt(process.env.SMTP_PORT, 10)
      : 465;
    const smtpFrom = process.env.SMTP_FROM || smtpUser;
    const fromName = process.env.SMTP_FROM_NAME || '연차 관리 시스템';

    // SMTP 계정 미설정 시 처리
    if (!smtpUser || !smtpPassword) {
      console.warn(
        `[Email Skipped - SMTP 미설정] 수신자: ${to} | 제목: ${subject} | .env.local에 SMTP_USER 및 SMTP_PASSWORD 설정이 필요합니다.`
      );
      return NextResponse.json(
        {
          success: false,
          error:
            '실제 이메일 발송을 위한 SMTP 발신 계정(SMTP_USER, SMTP_PASSWORD)이 설정되지 않았습니다. .env.local에 구글(Gmail) 또는 네이버 SMTP 계정을 등록해 주세요.',
          smtpConfigured: false,
        },
        { status: 503 }
      );
    }

    // 실제 SMTP 전송 객체 생성 (Gmail은 service: 'gmail'로 자동 최적화)
    const transporter = nodemailer.createTransport(
      isGmail
        ? {
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: smtpPassword,
            },
          }
        : {
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPassword,
            },
          }
    );

    const info = await transporter.sendMail({
      from: `"${fromName}" <${smtpFrom}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log(`[Email Sent Real] MessageId: ${info.messageId} | To: ${to} | Subject: ${subject}`);

    return NextResponse.json({
      success: true,
      message: `${to} 주소로 실제 안내 메일이 성공적으로 전송되었습니다.`,
      messageId: info.messageId,
      to,
      type,
      subject,
    });
  } catch (error: any) {
    console.error('이메일 전송 API 오류:', error);
    return NextResponse.json(
      { error: error.message || '이메일 전송 중 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
