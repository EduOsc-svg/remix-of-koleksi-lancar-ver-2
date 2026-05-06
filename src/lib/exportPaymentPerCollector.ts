import ExcelJS from 'exceljs';
import type { PaymentWithRelations } from '@/hooks/usePayments';

interface PaymentSummary {
  contractId: string;
  customerName: string;
  contractRef: string;
  paymentCount: number;
  totalCoupons: number;
  dailyAmount: number;
  totalAmount: number;
}

interface CollectorPaymentGroup {
  collectorName: string;
  collectorCode: string;
  payments: PaymentSummary[];
  totalPaymentCount: number;
  totalCoupons: number;
  totalAmount: number;
}

const HEADERS = [
  'No',
  'Konsumen',
  'Kode Kontrak',
  'Jumlah Pembayaran',
  'Jumlah Kupon',
  'Angsuran',
  'Total Tertagih (Rp)',
];

const COL_WIDTHS = [5, 30, 16, 16, 12, 14, 18];

/**
 * Export Input Pembayaran per Kolektor (bukan per Sales)
 * - Hanya menampilkan pembayaran yang diterima pada hari yang dipilih
 * - Group by Kolektor (bukan Sales Agent)
 */
export const exportPaymentPerCollectorToExcel = async (
  payments: PaymentWithRelations[],
  contracts: any[],
  collectors: any[],
  selectedDate: Date = new Date()
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Management System Kredit';
  workbook.created = new Date();

  // Format selected date
  const dateStr = selectedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Group payments by collector
  const collectorGroupMap = new Map<string, PaymentSummary[]>();
  const bulkMap = new Map<string, PaymentSummary>();

  // Build bulk summary from payments
  payments.forEach((payment) => {
    const contract = contracts.find(c => c.id === payment.contract_id);
    const dailyAmount = contract?.daily_installment_amount || 0;
    const customerName = payment.credit_contracts?.customers?.name || '-';
    const contractRef = payment.credit_contracts?.contract_ref || '-';
    const collectorId = contract?.collector_id || 'unassigned';

    const key = payment.contract_id;
    if (!bulkMap.has(key)) {
      bulkMap.set(key, {
        contractId: payment.contract_id,
        customerName,
        contractRef,
        paymentCount: 0,
        totalCoupons: 0,
        dailyAmount,
        totalAmount: 0,
      });
    }

    const summary = bulkMap.get(key)!;
    summary.paymentCount += 1;
    summary.totalCoupons += 1; // 1 pembayaran = 1 kupon
    summary.totalAmount += dailyAmount;

    // Group by collector
    if (!collectorGroupMap.has(collectorId)) {
      collectorGroupMap.set(collectorId, []);
    }
    // Add summary if not already in this collector group
    const collectorGroup = collectorGroupMap.get(collectorId)!;
    if (!collectorGroup.some(s => s.contractId === summary.contractId)) {
      collectorGroup.push(summary);
    }
  });

  // Create sheets for each collector
  const collectorList = Array.from(collectorGroupMap.entries())
    .map(([collectorId, paymentSummaries]) => {
      const collector = collectors.find(c => c.id === collectorId);
      const collectorName = collector?.name || 'Tidak Ditugaskan';
      const collectorCode = collector?.collector_code || '-';

      const sortedPayments = paymentSummaries.sort((a, b) => a.contractRef.localeCompare(b.contractRef));

      const totalPaymentCount = sortedPayments.reduce((sum, p) => sum + p.paymentCount, 0);
      const totalCoupons = sortedPayments.reduce((sum, p) => sum + p.totalCoupons, 0);
      const totalAmount = sortedPayments.reduce((sum, p) => sum + p.totalAmount, 0);

      return {
        collectorName,
        collectorCode,
        payments: sortedPayments,
        totalPaymentCount,
        totalCoupons,
        totalAmount,
      };
    })
    .sort((a, b) => a.collectorName.localeCompare(b.collectorName));

  // Create summary sheet first
  const summarySheet = workbook.addWorksheet('Ringkasan');

  summarySheet.mergeCells('A1:G1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'RINGKASAN INPUT PEMBAYARAN PER KOLEKTOR';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  summarySheet.mergeCells('A2:G2');
  const dateCell = summarySheet.getCell('A2');
  dateCell.value = `Per tanggal: ${dateStr}`;
  dateCell.font = { italic: true, size: 12 };
  dateCell.alignment = { horizontal: 'center' };

  summarySheet.addRow([]);

  // Summary headers
  const summaryHeaders = ['No', 'Kolektor', 'Kode Kolektor', 'Jumlah Pembayaran', 'Jumlah Kupon', 'Total (Rp)'];
  const summaryHRow = summarySheet.addRow(summaryHeaders);
  summaryHRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  });

  // Add summary data
  collectorList.forEach((collector, idx) => {
    const row = summarySheet.addRow([
      idx + 1,
      collector.collectorName,
      collector.collectorCode,
      collector.totalPaymentCount,
      collector.totalCoupons,
      collector.totalAmount,
    ]);

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
      if ([4, 5].includes(colNumber)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if (colNumber === 6) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });
  });

  summarySheet.columns = [
    { width: 5 },
    { width: 25 },
    { width: 16 },
    { width: 16 },
    { width: 12 },
    { width: 18 },
  ];

  // Create detailed sheet for each collector
  collectorList.forEach((collector) => {
    const sheet = workbook.addWorksheet(
      collector.collectorName.substring(0, 28).replace(/[\\/*?[\]:]/g, '')
    );

    // Title
    sheet.mergeCells('A1:G1');
    const collectorTitleCell = sheet.getCell('A1');
    collectorTitleCell.value = `INPUT PEMBAYARAN - ${collector.collectorName.toUpperCase()}`;
    collectorTitleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    collectorTitleCell.alignment = { horizontal: 'center' };
    collectorTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    // Date
    sheet.mergeCells('A2:G2');
    const collectorDateCell = sheet.getCell('A2');
    collectorDateCell.value = `Per tanggal: ${dateStr}`;
    collectorDateCell.font = { italic: true, size: 12 };
    collectorDateCell.alignment = { horizontal: 'center' };

    // Code info
    sheet.mergeCells('A3:G3');
    const codeCell = sheet.getCell('A3');
    codeCell.value = `Kode Kolektor: ${collector.collectorCode}`;
    codeCell.font = { size: 11 };
    codeCell.alignment = { horizontal: 'center' };

    sheet.addRow([]);

    // Headers
    const hRow = sheet.addRow(HEADERS);
    hRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    const startRow = hRow.number + 1;

    // Data rows
    collector.payments.forEach((payment, idx) => {
      const rowNum = startRow + idx;
      const dataRowValues = [
        idx + 1,
        payment.customerName,
        payment.contractRef,
        payment.paymentCount,
        payment.totalCoupons,
        payment.dailyAmount,
        payment.totalAmount,
      ];

      const dataRow = sheet.addRow(dataRowValues);

      dataRow.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'thin' },
        };

        if ([4, 5].includes(colNumber)) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        } else if ([6, 7].includes(colNumber)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });
    });

    // Subtotal row
    const subtotalRow = sheet.addRow([
      '',
      'SUBTOTAL',
      '',
      collector.totalPaymentCount,
      collector.totalCoupons,
      '',
      collector.totalAmount,
    ]);

    subtotalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203864' } };
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
        left: { style: 'thin' },
        right: { style: 'thin' },
      };
      if ([4, 5].includes(colNumber)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if ([6, 7].includes(colNumber)) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });

    // Column widths
    HEADERS.forEach((_, i) => {
      sheet.getColumn(i + 1).width = COL_WIDTHS[i];
    });
  });

  // Generate file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = `Input_Pembayaran_Per_Kolektor_${dateStr.replace(/\s+/g, '_')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
