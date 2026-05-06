import ExcelJS from 'exceljs';
import type { PaymentWithRelations } from '@/hooks/usePayments';

interface BulkPaymentSummary {
  contractId: string;
  customerName: string;
  contractRef: string;
  paymentCount: number;
  totalCoupons: number;
  dailyAmount: number;
  totalAmount: number;
}

interface SalesPaymentGroup {
  salesAgentName: string;
  salesAgentCode: string;
  payments: BulkPaymentSummary[];
  totalPaymentCount: number;
  totalCoupons: number;
  totalAmount: number;
}

const HEADERS = [
  'No', 'Konsumen', 'Kode Kontrak', 'Jumlah Pembayaran', 'Jumlah Kupon', 'Angsuran', 'Total Tertagih (Rp)'
];

const COL_WIDTHS = [5, 30, 16, 16, 12, 14, 18];

export const exportPaymentPerSalesExcel = async (payments: PaymentWithRelations[], contracts: any[], salesAgents: any[]) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Management System Kredit';
  workbook.created = new Date();

  // Group payments by sales agent
  const salesGroupMap = new Map<string, BulkPaymentSummary[]>();

  const bulkMap = new Map<string, BulkPaymentSummary>();

  payments.forEach((payment) => {
    const contract = contracts.find(c => c.id === payment.contract_id);
    const dailyAmount = contract?.daily_installment_amount || 0;
    const customerName = payment.credit_contracts?.customers?.name || '-';
    const contractRef = payment.credit_contracts?.contract_ref || '-';
    const salesAgentId = contract?.sales_agent_id || 'unassigned';

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

    // Group by sales agent
    if (!salesGroupMap.has(salesAgentId)) {
      salesGroupMap.set(salesAgentId, []);
    }
    // Add summary if not already in this sales group
    const salesGroup = salesGroupMap.get(salesAgentId)!;
    if (!salesGroup.some(s => s.contractId === summary.contractId)) {
      salesGroup.push(summary);
    }
  });

  // Create sheets for each sales agent
  const salesList = Array.from(salesGroupMap.entries()).map(([salesAgentId, paymentSummaries]) => {
    const salesAgent = salesAgents.find(sa => sa.id === salesAgentId);
    const salesAgentName = salesAgent?.name || 'Tidak Ditugaskan';
    const salesAgentCode = salesAgent?.agent_code || '-';

    const sortedPayments = paymentSummaries.sort((a, b) => a.contractRef.localeCompare(b.contractRef));

    const totalPaymentCount = sortedPayments.reduce((sum, p) => sum + p.paymentCount, 0);
    const totalCoupons = sortedPayments.reduce((sum, p) => sum + p.totalCoupons, 0);
    const totalAmount = sortedPayments.reduce((sum, p) => sum + p.totalAmount, 0);

    return {
      salesAgentName,
      salesAgentCode,
      payments: sortedPayments,
      totalPaymentCount,
      totalCoupons,
      totalAmount,
    };
  });

  // Sort sales agents by name
  salesList.sort((a, b) => a.salesAgentName.localeCompare(b.salesAgentName));

  // Create summary sheet
  const summarySheet = workbook.addWorksheet('Ringkasan');
  
  // Title
  summarySheet.mergeCells('A1:G1');
  const titleCell = summarySheet.getCell('A1');
  titleCell.value = 'RINGKASAN INPUT PEMBAYARAN PER SALES';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  // Date info
  summarySheet.mergeCells('A2:G2');
  const dateCell = summarySheet.getCell('A2');
  dateCell.value = `Per tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  dateCell.font = { italic: true, size: 12 };
  dateCell.alignment = { horizontal: 'center' };

  summarySheet.addRow([]);

  // Summary headers
  const summaryHeaders = ['No', 'Sales Agent', 'Kode Sales', 'Jumlah Kontrak', 'Total Pembayaran', 'Total Kupon', 'Total Tertagih (Rp)'];
  const summaryHRow = summarySheet.addRow(summaryHeaders);
  summaryHRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Summary data rows
  salesList.forEach((sales, idx) => {
    const summaryRow = summarySheet.addRow([
      idx + 1,
      sales.salesAgentName,
      sales.salesAgentCode,
      sales.payments.length,
      sales.totalPaymentCount,
      sales.totalCoupons,
      sales.totalAmount,
    ]);

    summaryRow.eachCell((cell, colNumber) => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

      if ([4, 5, 6].includes(colNumber)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if (colNumber === 7) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });
  });

  // Total row in summary
  if (salesList.length > 0) {
    const summaryStartRow = 5; // After title, date, blank, headers
    const summaryEndRow = summaryStartRow + salesList.length - 1;
    
    const summaryTotalRow = summarySheet.addRow([
      '',
      '',
      'TOTAL',
      { formula: `SUM(D${summaryStartRow}:D${summaryEndRow})` },
      { formula: `SUM(E${summaryStartRow}:E${summaryEndRow})` },
      { formula: `SUM(F${summaryStartRow}:F${summaryEndRow})` },
      { formula: `SUM(G${summaryStartRow}:G${summaryEndRow})` },
    ]);

    summaryTotalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
      cell.border = { top: { style: 'double' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
      
      if ([4, 5, 6].includes(colNumber)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if (colNumber === 7) {
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  summarySheet.columns = [
    { width: 5 },
    { width: 30 },
    { width: 14 },
    { width: 16 },
    { width: 16 },
    { width: 12 },
    { width: 18 },
  ];

  // Create sheet for each sales agent
  salesList.forEach((sales) => {
    const sheet = workbook.addWorksheet(sales.salesAgentCode || 'Unassigned');

    // Title
    sheet.mergeCells('A1:G1');
    const sheetTitleCell = sheet.getCell('A1');
    sheetTitleCell.value = `INPUT PEMBAYARAN - ${sales.salesAgentName}`;
    sheetTitleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    sheetTitleCell.alignment = { horizontal: 'center' };
    sheetTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    // Date info
    sheet.mergeCells('A2:G2');
    const sheetDateCell = sheet.getCell('A2');
    sheetDateCell.value = `Per tanggal: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    sheetDateCell.font = { italic: true, size: 11 };
    sheetDateCell.alignment = { horizontal: 'center' };

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
    sales.payments.forEach((bulk, i) => {
      const dataRowValues = [
        i + 1,
        bulk.customerName,
        bulk.contractRef,
        bulk.paymentCount,
        bulk.totalCoupons,
        bulk.dailyAmount,
        bulk.totalAmount,
      ];

      const dataRow = sheet.addRow(dataRowValues);

      dataRow.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

        if ([4, 5].includes(colNumber)) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        } else if ([6, 7].includes(colNumber)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });
    });

    // Total row
    if (sales.payments.length > 0) {
      const endRow = startRow + sales.payments.length - 1;
      const totalRowValues = [
        '', '', 'TOTAL', '', '',
        { formula: `SUM(F${startRow}:F${endRow})` },
        { formula: `SUM(G${startRow}:G${endRow})` },
      ];

      const totalRow = sheet.addRow(totalRowValues);

      totalRow.eachCell((cell, colNumber) => {
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
        cell.border = { top: { style: 'double' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
        
        if ([4, 5].includes(colNumber)) {
          cell.numFmt = '#,##0';
          cell.alignment = { horizontal: 'center' };
        } else if ([6, 7].includes(colNumber)) {
          cell.numFmt = '"Rp "#,##0';
          cell.alignment = { horizontal: 'right' };
        }
      });
    }

    // Column widths
    sheet.columns = COL_WIDTHS.map((width) => ({ width }));
  });

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Input_Pembayaran_Per_Sales_${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
