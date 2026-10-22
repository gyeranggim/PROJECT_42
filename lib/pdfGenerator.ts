import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * HTML 엘리먼트를 A4 규격의 고화질 연차유급휴가신청서 PDF Blob으로 변환합니다.
 */
export async function generateLeavePdfBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.98);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
  const marginX = 15; // 좌우 15mm 여백
  const printWidth = pageWidth - (marginX * 2); // 180mm
  const printHeight = (canvas.height * printWidth) / canvas.width;
  const marginY = 15; // 상단 15mm 여백

  pdf.addImage(imgData, 'JPEG', marginX, marginY, printWidth, printHeight);
  return pdf.output('blob');
}
