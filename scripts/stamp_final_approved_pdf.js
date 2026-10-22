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

// 사원의 실제 전자서명 데이터 로드
const sigJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'sig_data.json'), 'utf8'));
const signatureData = sigJson.signature_data;

const record = {
  id: '485dc86b-8ce1-457e-84c0-ba3d537b43f0',
  user_name: '김직원',
  email: 'test1@example.com',
  department: '영업1팀',
  leave_type: '종일',
  start_date: '2026-10-29',
  end_date: '2026-10-30',
  reason: '개인사유',
  status: '승인',
  signature_data: signatureData,
};

async function run() {
  console.log('Generating approved PDF with employee sign and team leader approval stamp...');

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

  // 1) 기안자란: 사원이 직접 그린 실제 서명 이미지 날인!
  if (record.signature_data) {
    try {
      doc.addImage(record.signature_data, 'PNG', approvalX + 2, approvalY + rowH1 + 1.5, colW - 4, rowH2 - 3);
    } catch (e) {
      console.warn('Signature image add error:', e);
    }
  }

  // 2) 팀장 승인란: 정식 팀장 승인 도장 날인 (원형 인영 + 팀장 승인 문구 + 승인일)
  const stampX = approvalX + colW + 13;
  const stampY = approvalY + rowH1 + 6.5;

  doc.setDrawColor(220, 38, 38); // Red seal
  doc.setLineWidth(0.7);
  doc.circle(stampX, stampY, 5.5, 'S');

  doc.setFontSize(6.5);
  doc.setTextColor(220, 38, 38);
  doc.text('팀장', stampX, stampY - 1, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text('승인', stampX, stampY + 2.5, { align: 'center' });

  doc.setFontSize(5.5);
  doc.setTextColor(140, 140, 140);
  doc.text('2026.10.20', stampX, stampY + 7.5, { align: 'center' });

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
  doc.text(record.department || '영업1팀', left + thWidth * 2 + tdWidth + 4, currentY + 6.2);

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
  doc.text('2 일간', left + thWidth * 2 + tdWidth + 4, currentY + 6.2);

  // Row 2: 기간
  currentY += rowHeight;
  doc.setFillColor(247, 248, 247);
  doc.rect(left, currentY, thWidth, rowHeight, 'FD');
  doc.rect(left + thWidth, currentY, width - thWidth, rowHeight, 'S');

  doc.setTextColor(80, 80, 80);
  doc.text('휴가 기간', left + thWidth / 2, currentY + 6.2, { align: 'center' });
  doc.setTextColor(20, 20, 20);
  doc.text(`${sDate} ~ ${eDate}`, left + thWidth + 4, currentY + 6.2);

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
  currentY += reasonH;

  // 3. 서약 문구
  currentY += 18;
  doc.setFontSize(10.5);
  doc.setTextColor(60, 60, 60);
  doc.text('근로기준법 제60조 및 사내 취업규칙 제24조에 의거하여', 105, currentY, { align: 'center' });
  currentY += 6.5;
  doc.text('위와 같이 연차유급휴가를 신청하오니 허가하여 주시기 바랍니다.', 105, currentY, { align: 'center' });

  // 4. 신청 일자 및 신청인 서명
  currentY += 22;
  const year = '2026';
  const month = '10';
  const day = '20';

  doc.setFontSize(11);
  doc.setTextColor(40, 40, 40);
  doc.text(`${year}년   ${month}월   ${day}일`, 105, currentY, { align: 'center' });

  currentY += 16;
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  const applicantStr = `신 청 인 :   ${record.user_name || '김직원'}`;
  doc.text(applicantStr, 115, currentY);

  // 하단 신청인 서명란: 사원의 실제 서명 이미지 날인
  if (record.signature_data) {
    try {
      doc.addImage(record.signature_data, 'PNG', 138, currentY - 7.5, 26, 11);
    } catch (e) {
      console.warn(e);
    }
  }

  // 붉은색 전자직인 스탬프 날인
  const bStampX = 172;
  const bStampY = currentY - 3.5;
  doc.setDrawColor(210, 40, 40);
  doc.setLineWidth(0.8);
  doc.circle(bStampX, bStampY, 6.5, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(210, 40, 40);
  doc.text('김직', bStampX, bStampY - 1, { align: 'center' });
  doc.text('직인', bStampX, bStampY + 2.5, { align: 'center' });

  // 하단 회사명
  currentY += 24;
  doc.setFontSize(13);
  doc.setTextColor(30, 57, 50);
  doc.text('스타벅스 코리아 인사운영팀 귀하', 105, currentY, { align: 'center' });

  doc.setFontSize(7.5);
  doc.setTextColor(160, 160, 160);
  doc.text(`문서번호: LEAVE-20261020-485DC86B`, left, 280);
  doc.text(`보관처: Supabase Secure Storage | 본 문서는 사원 서명 및 팀장 승인 도장이 날인된 최종 결재본입니다.`, right, 280, { align: 'right' });

  const finalPdfBuffer = Buffer.from(doc.output('arraybuffer'));
  console.log('Final PDF Buffer size:', finalPdfBuffer.length);

  // Supabase Storage 업로드: leave_sales_test1_20261029_160751_approved.pdf
  const storagePath = 'sales/leave_sales_test1_20261029_160751_approved.pdf';
  console.log(`Uploading to [${storagePath}]...`);

  const { error: uploadErr } = await supabase.storage
    .from('leave-documents')
    .upload(storagePath, finalPdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (uploadErr) {
    console.error('Upload error:', uploadErr);
    return;
  }

  const { data: publicData } = supabase.storage
    .from('leave-documents')
    .getPublicUrl(storagePath);

  const finalUrl = publicData.publicUrl;
  console.log('Upload success! Final Public URL:', finalUrl);
}

run();
