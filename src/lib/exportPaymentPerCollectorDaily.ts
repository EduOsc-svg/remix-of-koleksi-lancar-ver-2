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
  collectorId: string;
  collectorName: string;
  collectorCode: string;
  payments: PaymentSummary[];
  totalPaymentCount: number;
  totalCoupons: number;
  totalAmount: number;
}

const HEADERS = [
  'No', 'Konsumen', 'Kode Kontrak', 'Jumlah Pembayaran', 'Jumlah Kupon', 'Angsuran/Kupon (Rp)', 'Total Tertagih (Rp)'
];

const COL_WIDTHS = [5, 30, 16, 16, 12, 18, 18];

export const exportPaymentPerCollectorDaily = async (
  payments: PaymentWithRelations[],
  contracts: any[],
  selectedDate: string
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Management System Kredit';
  workbook.created = new Date();

  // Group payments by collector
  const collectorGroupMap = new Map<string, PaymentSummary[]>();
  const collectorInfoMap = new Map<string, { name: string; code: string }>();

  const bulkMap = new Map<string, PaymentSummary>();

  payments.forEach((payment) => {
    const contract = contracts.find(c => c.id === payment.contract_id);
    const dailyAmount = contract?.daily_installment_amount || 0;
    const customerName = payment.credit_contracts?.customers?.name || '-';
    const contractRef = payment.credit_contracts?.contract_ref || '-';
    const collectorId = payment.collector_id || 'unassigned';
    const collectorName = payment.collectors?.name || 'Tidak Ditugaskan';
    const collectorCode = payment.collectors?.collector_code || '-';

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
    summary.totalCoupons += 1;
    summary.totalAmount += dailyAmount;

    // Group by collector
    if (!collectorGroupMap.has(collectorId)) {
      collectorGroupMap.set(collectorId, []);
      collectorInfoMap.set(collectorId, { name: collectorName, code: collectorCode });
    }
    const collectorGroup = collectorGroupMap.get(collectorId)!;
    if (!collectorGroup.some(s => s.contractId === summary.contractId)) {
      collectorGroup.push(summary);
    }
  });

  // Create summary sheet
  const summarySheet = workbook.addWorksheet('Ringkasan');

  // Title
  summarySheet.mergeCells('A1:G1');
  const summaryTitleCell = summarySheet.getCell('A1');
  summaryTitleCell.value = 'LAPORAN INPUT PEMBAYARAN - RINGKASAN PER KOLEKTOR';
  summaryTitleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  summaryTitleCell.alignment = { horizontal: 'center' };
  summaryTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  // Date info
  summarySheet.mergeCells('A2:G2');
  const summaryDateCell = summarySheet.getCell('A2');
  summaryDateCell.value = `Tanggal: ${new Date(selectedDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  summaryDateCell.font = { italic: true, size: 12 };
  summaryDateCell.alignment = { horizontal: 'center' };

  summarySheet.addRow([]);

  // Headers
  const summaryHeaders = ['No', 'Kolektor', 'Kode', 'Jumlah Pembayaran', 'Total Kupon', 'Total Tertagih (Rp)'];
  const summaryHRow = summarySheet.addRow(summaryHeaders);
  summaryHRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  const summaryStartRow = summaryHRow.number + 1;

  // Summary data
  const collectorList: CollectorPaymentGroup[] = Array.from(collectorGroupMap.entries()).map(([collectorId, paymentSummaries]) => {
    const collectorInfo = collectorInfoMap.get(collectorId)!;
    const sortedPayments = paymentSummaries.sort((a, b) => a.contractRef.localeCompare(b.contractRef));
    const totalPaymentCount = sortedPayments.reduce((sum, p) => sum + p.paymentCount, 0);
    const totalCoupons = sortedPayments.reduce((sum, p) => sum + p.totalCoupons, 0);
    const totalAmount = sortedPayments.reduce((sum, p) => sum + p.totalAmount, 0);

    return {
      collectorId,
      collectorName: collectorInfo.name,
      collectorCode: collectorInfo.code,
      payments: sortedPayments,
      totalPaymentCount,
      totalCoupons,
      totalAmount,
    };
  });

  // Sort by collector name
  collectorList.sort((a, b) => a.collectorName.localeCompare(b.collectorName));

  // Summary rows
  collectorList.forEach((collector, i) => {
    const summaryRowValues = [
      i + 1,
      collector.collectorName,
      collector.collectorCode,
      collector.totalPaymentCount,
      collector.totalCoupons,
      collector.totalAmount,
    ];

    const summaryRow = summarySheet.addRow(summaryRowValues);
    summaryRow.eachCell((cell, colNum) => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      if ([4, 5].includes(colNum)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if ([6].includes(colNum)) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if (colNum === 1) {
        cell.alignment = { horizontal: 'center' };
      }
    });
  });

  summarySheet.columns = [5, 20, 12, 16, 12, 18].map((width) => ({ width }));

  // Create detail sheet per collector
  const usedNames = new Set<string>();
  collectorList.forEach(({ collectorName, collectorCode, payments: collectorPayments, totalPaymentCount, totalCoupons, totalAmount }) => {
    const baseName = collectorName.substring(0, 28).replace(/[\\/*?[\]:]/g, '');
    let safeName = baseName;
    let suffix = 1;
    while (usedNames.has(safeName) || workbook.getWorksheet(safeName)) {
      safeName = `${baseName}-${suffix}`;
      suffix += 1;
    }
    usedNames.add(safeName);

    // Create sheet for this collector
    const sheet = workbook.addWorksheet(safeName);

    // Title
    sheet.mergeCells('A1:G1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `LAPORAN INPUT PEMBAYARAN - ${collectorName.toUpperCase()}`;
    titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
    titleCell.alignment = { horizontal: 'center' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    // Date & Collector info
    sheet.mergeCells('A2:G2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `Tanggal: ${new Date(selectedDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} | Kolektor: ${collectorName} (${collectorCode})`;
    dateCell.font = { italic: true, size: 12 };
    dateCell.alignment = { horizontal: 'left' };

    sheet.addRow([]);

    // Headers
    const hRow = sheet.addRow(HEADERS);
    hRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
    });

    const startRow = hRow.number + 1;

    // Data rows
    collectorPayments.forEach((payment, idx) => {
      const rowValues = [
        idx + 1,
        payment.customerName,
        payment.contractRef,
        payment.paymentCount,
        payment.totalCoupons,
        payment.dailyAmount,
        payment.totalAmount,
      ];

      const row = sheet.addRow(rowValues);
      row.eachCell((cell, colNum) => {
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

        if ([4, 5].includes(colNum)) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        } else if ([6, 7].includes(colNum)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        } else if (colNum === 1) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    // Subtotal row
    const subtotalRowNum = startRow + collectorPayments.length;
    const subtotalRowValues = [
      '', '', 'TOTAL:', 
      { formula: `SUM(D${startRow}:D${subtotalRowNum - 1})` },
      { formula: `SUM(E${startRow}:E${subtotalRowNum - 1})` },
      '',
      { formula: `SUM(G${startRow}:G${subtotalRowNum - 1})` },
    ];

    const subtotalRow = sheet.addRow(subtotalRowValues);
    subtotalRow.eachCell((cell, colNum) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

      if ([4, 5].includes(colNum)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if ([7].includes(colNum)) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      } else if (colNum === 3) {
        cell.alignment = { horizontal: 'right' };
      }
    });

    sheet.columns = COL_WIDTHS.map((width) => ({ width }));
  });

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Pembayaran_${selectedDate}_Per_Kolektor.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
