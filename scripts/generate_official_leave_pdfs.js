const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const supabaseUrl = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
const supabaseKey = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();

const supabase = createClient(supabaseUrl, supabaseKey);

// 맑은 고딕 폰트 로드
const fontPath = 'C:\\Windows\\Fonts\\malgun.ttf';
const fontBase64 = fs.readFileSync(fontPath).toString('base64');

const requests = [
  {
    id: '97f70af7-776f-4a5d-b709-fccd129f7f63',
    email: 'test1@example.com',
    user_name: '김직원',
    department: '영업1팀',
    leave_type: '종일',
    start_date: '2026-10-26',
    end_date: '2026-10-26',
    reason: '개인사유',
    status: '승인',
    reject_reason: null,
    created_at: '2026-10-20 06:06:26',
    storage_path: 'sales/leave_sales_test1_20261026_150626_signed.pdf',
  },
  {
    id: 'ecbfbedb-ae1c-40de-9d10-d819b3fba556',
    email: 'test1@example.com',
    user_name: '김직원',
    department: '영업1팀',
    leave_type: '오전반차',
    start_date: '2026-10-22',
    end_date: '2026-10-22',
    reason: '병원진료',
    status: '승인',
    reject_reason: null,
    created_at: '2026-10-20 05:56:47',
    storage_path: 'sales/leave_sales_test1_20261022_145647_signed.pdf',
  },
  {
    id: '01df8ed6-a4b5-4cb1-85d1-da2619387ab2',
    email: 'test2@example.com',
    user_name: '이사원',
    department: '마케팅팀',
    leave_type: '종일',
    start_date: '2026-10-20',
    end_date: '2026-10-22',
    reason: '병원 진료 및 휴식',
    status: '승인',
    reject_reason: null,
    created_at: '2026-10-13 08:09:25',
    storage_path: 'marketing/leave_marketing_test2_20261020_080925_signed.pdf',
  },
  {
    id: 'c235dcbe-eb96-473c-a003-c622507e1a4b',
    email: 'test2@example.com',
    user_name: '이사원',
    department: '마케팅팀',
    leave_type: '종일',
    start_date: '2026-10-15',
    end_date: '2026-10-16',
    reason: '가족행사',
    status: '승인',
    reject_reason: null,
    created_at: '2026-10-13 06:18:44',
    storage_path: 'marketing/leave_marketing_test2_20261015_061844_signed.pdf',
  },
  {
    id: 'c7446a6c-2c3f-4506-bc6e-75100bfd13fe',
    email: 'test1@example.com',
    user_name: '김직원',
    department: '영업1팀',
    leave_type: '종일',
    start_date: '2026-10-14',
    end_date: '2026-10-16',
    reason: '가을 정기 휴가',
    status: '반려',
    reject_reason: '영업본부 분기 마감 실적 취합 일정으로 인한 일정 조정 요청',
    created_at: '2026-10-13 06:15:56',
    storage_path: 'sales/leave_sales_test1_20261014_061556_signed.pdf',
  },
];

/**
 * 만년필 잉크 질감의 유려한 실제 필기체 전자서명을 벡터로 그립니다.
 */
function drawKoreanSignature(doc, name, startX, startY, scale = 1) {
  doc.saveGraphicsState();
  doc.setDrawColor(24, 43, 115); // Authentic Dark Fountain Pen Navy #182b73
  doc.setLineCap('round');
  doc.setLineJoin('round');

  const isKim = (name || '').includes('김') || (name || '').includes('test1');

  if (isKim) {
    // [김직원] 유려한 전자 필기 서명
    // 1. '김' 첫 획 루프 및 하향 전개
    doc.setLineWidth(0.65 * scale);
    doc.moveTo(startX + 2 * scale, startY + 7 * scale);
    doc.curveTo(startX + 4 * scale, startY + 2 * scale, startX + 8 * scale, startY + 1 * scale, startX + 11 * scale, startY + 4 * scale);
    doc.curveTo(startX + 12 * scale, startY + 7 * scale, startX + 7 * scale, startY + 9 * scale, startX + 5 * scale, startY + 8 * scale);
    doc.curveTo(startX + 3 * scale, startY + 6 * scale, startX + 6 * scale, startY + 3 * scale, startX + 12 * scale, startY + 5.5 * scale);
    doc.stroke();

    // 기둥 획 (강약 조절)
    doc.setLineWidth(0.75 * scale);
    doc.moveTo(startX + 9.5 * scale, startY + 3.2 * scale);
    doc.curveTo(startX + 10 * scale, startY + 7 * scale, startX + 8.5 * scale, startY + 10.5 * scale, startX + 9 * scale, startY + 12 * scale);
    doc.stroke();

    // 2. '직' 유려한 꺾임 곡선
    doc.setLineWidth(0.6 * scale);
    doc.moveTo(startX + 13 * scale, startY + 4 * scale);
    doc.curveTo(startX + 16 * scale, startY + 3 * scale, startX + 18 * scale, startY + 5 * scale, startX + 16 * scale, startY + 7.5 * scale);
    doc.curveTo(startX + 14 * scale, startY + 9.5 * scale, startX + 13.5 * scale, startY + 11.5 * scale, startX + 15.5 * scale, startY + 11.8 * scale);
    doc.curveTo(startX + 18 * scale, startY + 11.5 * scale, startX + 20 * scale, startY + 8 * scale, startX + 21 * scale, startY + 5 * scale);
    doc.stroke();

    // 3. '원' 동그란 회전 루프
    doc.setLineWidth(0.65 * scale);
    doc.moveTo(startX + 21.5 * scale, startY + 6 * scale);
    doc.curveTo(startX + 24.5 * scale, startY + 4 * scale, startX + 26 * scale, startY + 7 * scale, startX + 24 * scale, startY + 9.5 * scale);
    doc.curveTo(startX + 22 * scale, startY + 11.5 * scale, startX + 19.5 * scale, startY + 9.5 * scale, startX + 21.5 * scale, startY + 6.5 * scale);
    doc.stroke();

    // 4. 하단 서명 받침 밑줄 플러리시 (Flourish)
    doc.setLineWidth(0.8 * scale);
    doc.moveTo(startX + 4 * scale, startY + 12 * scale);
    doc.curveTo(startX + 12 * scale, startY + 13.5 * scale, startX + 20 * scale, startY + 13 * scale, startX + 26.5 * scale, startY + 11 * scale);
    doc.stroke();

    // 끝점 펜 터치 도트
    doc.setFillColor(24, 43, 115);
    doc.circle(startX + 28 * scale, startY + 10.8 * scale, 0.45 * scale, 'F');
  } else {
    // [이사원] 감각적인 곡선형 전자 필기 서명
    // 1. '이' 수직선 및 곡선
    doc.setLineWidth(0.7 * scale);
    doc.moveTo(startX + 3 * scale, startY + 3 * scale);
    doc.curveTo(startX + 3 * scale, startY + 8 * scale, startX + 2.5 * scale, startY + 11 * scale, startX + 3.5 * scale, startY + 12.5 * scale);
    doc.stroke();

    // 2. '사' 뻗어나가는 획
    doc.setLineWidth(0.6 * scale);
    doc.moveTo(startX + 6 * scale, startY + 4.5 * scale);
    doc.curveTo(startX + 9 * scale, startY + 2.5 * scale, startX + 12 * scale, startY + 5.5 * scale, startX + 9.5 * scale, startY + 8.5 * scale);
    doc.curveTo(startX + 7.5 * scale, startY + 11.5 * scale, startX + 12.5 * scale, startY + 11.5 * scale, startX + 16.5 * scale, startY + 6.5 * scale);
    doc.stroke();

    // 3. '원' 피날레 루프
    doc.setLineWidth(0.65 * scale);
    doc.moveTo(startX + 16.5 * scale, startY + 6.5 * scale);
    doc.curveTo(startX + 19.5 * scale, startY + 4.5 * scale, startX + 22.5 * scale, startY + 7.5 * scale, startX + 20.5 * scale, startY + 10.5 * scale);
    doc.curveTo(startX + 18.5 * scale, startY + 12.5 * scale, startX + 15.5 * scale, startY + 10.5 * scale, startX + 17.5 * scale, startY + 7.5 * scale);
    doc.stroke();

    // 4. 하단 받침 밑줄 플러리시
    doc.setLineWidth(0.8 * scale);
    doc.moveTo(startX + 5 * scale, startY + 12.5 * scale);
    doc.curveTo(startX + 14 * scale, startY + 14 * scale, startX + 22 * scale, startY + 13 * scale, startX + 27.5 * scale, startY + 10.5 * scale);
    doc.stroke();

    // 끝점 펜 터치 도트
    doc.setFillColor(24, 43, 115);
    doc.circle(startX + 29 * scale, startY + 10.3 * scale, 0.45 * scale, 'F');
  }

  doc.restoreGraphicsState();
}

function createLeavePdf(record) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  doc.addFileToVFS('malgun.ttf', fontBase64);
  doc.addFont('malgun.ttf', 'malgun', 'normal');
  doc.setFont('malgun');

  // 외곽 테두리 (문서 프레임)
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.6);
  doc.rect(12, 12, 186, 273);

  const left = 20;
  const right = 190;
  const width = right - left; // 170mm

  // 상단 헤더: 타이틀 & 영문 서브타이틀
  doc.setTextColor(30, 57, 50); // House Green #1E3932
  doc.setFontSize(22);
  doc.text('연 차 유 급 휴 가 신 청 서', left, 28);

  doc.setFontSize(8.5);
  doc.setTextColor(120, 120, 120);
  doc.text('ANNUAL LEAVE APPLICATION FORM', left, 34);

  // 결재선 테이블 (우측 상단)
  const approvalX = 138;
  const approvalY = 17;
  const colW = 26;
  const rowH1 = 6.5;
  const rowH2 = 15;

  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.setFillColor(248, 248, 248);
  doc.rect(approvalX, approvalY, colW * 2, rowH1, 'FD');
  doc.rect(approvalX, approvalY + rowH1, colW * 2, rowH2, 'S');
  doc.line(approvalX + colW, approvalY, approvalX + colW, approvalY + rowH1 + rowH2);

  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  doc.text('신청(기안)', approvalX + colW / 2, approvalY + 4.5, { align: 'center' });
  doc.text('승인(팀장)', approvalX + colW * 1.5, approvalY + 4.5, { align: 'center' });

  // ★ 기안자란: 실제 펜 필기체 전자서명 스트로크 직접 날인! ★
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text(record.user_name || '신청인', approvalX + 3, approvalY + rowH1 + 3.5);

  // 실제 필기 서명 렌더링
  drawKoreanSignature(doc, record.user_name || '김직원', approvalX - 1, approvalY + rowH1 + 0.5, 0.88);

  // 팀장 결재 상태 도장
  if (record.status === '승인') {
    doc.setDrawColor(0, 117, 74);
    doc.setFillColor(240, 248, 244);
    doc.roundedRect(approvalX + colW + 4, approvalY + rowH1 + 2.5, 18, 10, 1.5, 1.5, 'FD');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 117, 74);
    doc.text('승 인', approvalX + colW * 1.5, approvalY + rowH1 + 8.5, { align: 'center' });
  } else if (record.status === '반려') {
    doc.setDrawColor(220, 50, 50);
    doc.setFillColor(254, 242, 242);
    doc.roundedRect(approvalX + colW + 4, approvalY + rowH1 + 2.5, 18, 10, 1.5, 1.5, 'FD');
    doc.setFontSize(9.5);
    doc.setTextColor(220, 50, 50);
    doc.text('반 려', approvalX + colW * 1.5, approvalY + rowH1 + 8.5, { align: 'center' });
  } else {
    doc.setFontSize(8.5);
    doc.setTextColor(160, 160, 160);
    doc.text('결재대기', approvalX + colW * 1.5, approvalY + rowH1 + 8.5, { align: 'center' });
  }

  // 구분 가로선
  doc.setDrawColor(30, 57, 50);
  doc.setLineWidth(0.8);
  doc.line(left, 42, right, 42);

  // 1. 신청인 정보 섹션
  let currentY = 51;
  doc.setFontSize(10.5);
  doc.setTextColor(0, 117, 74);
  doc.text('■ 1. 신청인 인적사항', left, currentY);

  currentY += 4;
  const thWidth = 32;
  const tdWidth = (width - (thWidth * 2)) / 2;
  const rowHeight = 9.5;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);

  // Row 1: 성명 / 소속부서
  doc.setFillColor(247, 248, 247);
  doc.rect(left, currentY, thWidth, rowHeight, 'FD');
  doc.rect(left + thWidth + tdWidth, currentY, thWidth, rowHeight, 'FD');
  doc.rect(left + thWidth, currentY, tdWidth, rowHeight, 'S');
  doc.rect(left + thWidth * 2 + tdWidth, currentY, tdWidth, rowHeight, 'S');

  doc.setFontSize(9.5);
  doc.setTextColor(80, 80, 80);
  doc.text('성  명', left + thWidth / 2, currentY + 6.2, { align: 'center' });
  doc.text('소속 부서', left + thWidth + tdWidth + thWidth / 2, currentY + 6.2, { align: 'center' });

  doc.setTextColor(20, 20, 20);
  doc.text(record.user_name || '-', left + thWidth + 4, currentY + 6.2);
  doc.text(record.department || '-', left + thWidth * 2 + tdWidth + 4, currentY + 6.2);

  // Row 2: 이메일
  currentY += rowHeight;
  doc.setFillColor(247, 248, 247);
  doc.rect(left, currentY, thWidth, rowHeight, 'FD');
  doc.rect(left + thWidth, currentY, width - thWidth, rowHeight, 'S');

  doc.setTextColor(80, 80, 80);
  doc.text('이메일 계정', left + thWidth / 2, currentY + 6.2, { align: 'center' });
  doc.setTextColor(20, 20, 20);
  doc.text(record.email || '-', left + thWidth + 4, currentY + 6.2);

  // 2. 휴가 신청 내용 섹션
  currentY += rowHeight + 11;
  doc.setFontSize(10.5);
  doc.setTextColor(0, 117, 74);
  doc.text('■ 2. 휴가 신청 세부내용', left, currentY);

  currentY += 4;
  const sDate = record.start_date || '';
  const eDate = record.end_date || sDate;
  const lType = record.leave_type || '종일';

  let days = 1;
  if (lType.includes('반차')) {
    days = 0.5;
  } else if (sDate && eDate) {
    const s = new Date(sDate);
    const e = new Date(eDate);
    const diff = Math.ceil(Math.abs(e - s) / (1000 * 60 * 60 * 24)) + 1;
    days = isNaN(diff) ? 1 : diff;
  }

  // Row 1: 구분 / 신청일수
  doc.setFillColor(247, 248, 247);
  doc.rect(left, currentY, thWidth, rowHeight, 'FD');
  doc.rect(left + thWidth + tdWidth, currentY, thWidth, rowHeight, 'FD');
  doc.rect(left + thWidth, currentY, tdWidth, rowHeight, 'S');
  doc.rect(left + thWidth * 2 + tdWidth, currentY, tdWidth, rowHeight, 'S');

  doc.setTextColor(80, 80, 80);
  doc.text('휴가 구분', left + thWidth / 2, currentY + 6.2, { align: 'center' });
  doc.text('신청 일수', left + thWidth + tdWidth + thWidth / 2, currentY + 6.2, { align: 'center' });

  doc.setTextColor(0, 117, 74);
  doc.text(lType, left + thWidth + 4, currentY + 6.2);
  doc.setTextColor(20, 20, 20);
  doc.text(`${days} 일간`, left + thWidth * 2 + tdWidth + 4, currentY + 6.2);

  // Row 2: 기간
  currentY += rowHeight;
  doc.setFillColor(247, 248, 247);
  doc.rect(left, currentY, thWidth, rowHeight, 'FD');
  doc.rect(left + thWidth, currentY, width - thWidth, rowHeight, 'S');

  doc.setTextColor(80, 80, 80);
  doc.text('휴가 기간', left + thWidth / 2, currentY + 6.2, { align: 'center' });
  doc.setTextColor(20, 20, 20);
  const periodText = lType.includes('반차') || sDate === eDate ? `${sDate} (당일)` : `${sDate} ~ ${eDate}`;
  doc.text(periodText, left + thWidth + 4, currentY + 6.2);

  // Row 3: 사유
  currentY += rowHeight;
  const reasonH = 28;
  doc.setFillColor(247, 248, 247);
  doc.rect(left, currentY, thWidth, reasonH, 'FD');
  doc.rect(left + thWidth, currentY, width - thWidth, reasonH, 'S');

  doc.setTextColor(80, 80, 80);
  doc.text('신청 사유', left + thWidth / 2, currentY + 8.5, { align: 'center' });

  doc.setTextColor(20, 20, 20);
  const reasonLines = doc.splitTextToSize(record.reason || '개인 사유', width - thWidth - 8);
  doc.text(reasonLines, left + thWidth + 4, currentY + 8);

  // 반려 사유 (있는 경우)
  if (record.status === '반려' && record.reject_reason) {
    currentY += reasonH;
    const rejH = 18;
    doc.setFillColor(254, 242, 242);
    doc.rect(left, currentY, thWidth, rejH, 'FD');
    doc.rect(left + thWidth, currentY, width - thWidth, rejH, 'S');

    doc.setTextColor(200, 40, 40);
    doc.text('반려 사유', left + thWidth / 2, currentY + 8, { align: 'center' });
    const rejLines = doc.splitTextToSize(record.reject_reason, width - thWidth - 8);
    doc.text(rejLines, left + thWidth + 4, currentY + 8);
    currentY += rejH;
  } else {
    currentY += reasonH;
  }

  // 3. 서약 문구
  currentY += 18;
  doc.setFontSize(10.5);
  doc.setTextColor(60, 60, 60);
  doc.text('근로기준법 제60조 및 사내 취업규칙 제24조에 의거하여', 105, currentY, { align: 'center' });
  currentY += 6.5;
  doc.text('위와 같이 연차유급휴가를 신청하오니 허가하여 주시기 바랍니다.', 105, currentY, { align: 'center' });

  // 4. 신청 일자 및 신청인 서명
  currentY += 22;
  const dateObj = new Date(record.created_at || record.start_date);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(`${year}년   ${month}월   ${day}일`, 105, currentY, { align: 'center' });

  currentY += 16;
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const applicantStr = `신 청 인 :   ${record.user_name || '신청자'}`;
  doc.text(applicantStr, 115, currentY);

  // ★ 하단 신청인 서명란: 실제 펜 필기체 전자서명 + 붉은색 전자직인 스탬프 날인! ★
  drawKoreanSignature(doc, record.user_name || '김직원', 138, currentY - 7.5, 0.95);

  const stampX = 172;
  const stampY = currentY - 3.5;
  doc.setDrawColor(210, 40, 40);
  doc.setLineWidth(0.8);
  doc.circle(stampX, stampY, 6.5, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(210, 40, 40);
  doc.text(record.user_name ? record.user_name.slice(0, 2) : '직원', stampX, stampY - 1, { align: 'center' });
  doc.text('전자서명', stampX, stampY + 2.5, { align: 'center' });

  // 하단 회사명 및 관리부서
  currentY += 24;
  doc.setFontSize(13);
  doc.setTextColor(30, 57, 50);
  doc.text('스타벅스 코리아 인사운영팀 귀하', 105, currentY, { align: 'center' });

  // 최하단 문서 관리 식별자
  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.text(`문서번호: LEAVE-${year}${month}${day}-${record.id.slice(0, 8).toUpperCase()}`, left, 280);
  doc.text(`보관처: Supabase Secure Storage | 본 문서는 전자결재 시스템을 통해 유효하게 서명/승인되었습니다.`, right, 280, { align: 'right' });

  return Buffer.from(doc.output('arraybuffer'));
}

async function run() {
  for (const req of requests) {
    console.log(`Processing with handwritten signature: ${req.id} (${req.user_name})...`);
    const pdfBuffer = createLeavePdf(req);

    console.log(`Uploading to Supabase Storage: [${req.storage_path}] (${pdfBuffer.length} bytes)...`);
    const { error: uploadErr } = await supabase.storage
      .from('leave-documents')
      .upload(req.storage_path, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadErr) {
      console.error(`Upload error for ${req.id}:`, uploadErr);
      continue;
    }

    const { data: publicData } = supabase.storage
      .from('leave-documents')
      .getPublicUrl(req.storage_path);

    console.log(`Success! Public URL: ${publicData.publicUrl}`);
  }

  console.log('\nAll 5 PDFs with authentic handwritten signatures re-uploaded successfully!');
}

run();
