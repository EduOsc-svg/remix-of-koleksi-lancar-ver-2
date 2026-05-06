import ExcelJS from 'exceljs';
import type { PaymentWithRelations } from '@/hooks/usePayments';
import type { CouponHandover } from '@/hooks/useCouponHandovers';

interface BulkPaymentSummary {
  contractId: string;
  customerName: string;
  contractRef: string;
<<<<<<< HEAD
  paymentCount: number; // Pembayaran ke / kupon dibayar
  totalCoupons: number; // Kupon Bawa (handover)
  unpaidCount: number;  // Kupon Pulang (sisa belum tertagih)
=======
  paymentCount: number;
  totalCoupons: number;
  returnedCoupons: number;
>>>>>>> d0a35a3 (Update)
  dailyAmount: number;
  totalAmount: number;  // Tertagih
}

// Requested column order:
// Konsumen | Kode Kontrak | Pembayaran ke | Kupon Bawa | Kupon Pulang | Angsuran/Kupon (Rp) | Tertagih (Rp)
const HEADERS = [
  'No', 'Konsumen', 'Kode Kontrak', 'Pembayaran ke', 'Kupon Bawa', 'Kupon Pulang', 'Angsuran/Kupon (Rp)', 'Tertagih (Rp)'
];

const COL_WIDTHS = [5, 30, 16, 14, 12, 12, 18, 18];

/**
 * Export pembayaran dengan pencatatan lengkap semua handover (termasuk yang sudah lunas)
 * @param payments - Data pembayaran yang tercatat
 * @param contracts - Data kontrak untuk referensi
 * @param handovers - Semua handover (kupon diserahkan) - optional untuk kompatibilitas
 * @param selectedDate - Tanggal laporan
 */
export const exportPaymentInputToExcel = async (
  payments: PaymentWithRelations[], 
  contracts: any[], 
  handoversOrDate?: any,
  dateOrUndefined?: string
) => {
  // Handle backward compatibility: function dapat dipanggil dengan 2 atau 4 parameter
  let selectedDate: string | undefined;
  let handovers: CouponHandover[] = [];

  if (typeof handoversOrDate === 'string') {
    // Old signature: (payments, contracts, selectedDate)
    selectedDate = handoversOrDate;
  } else if (Array.isArray(handoversOrDate)) {
    // New signature: (payments, contracts, handovers, selectedDate)
    handovers = handoversOrDate;
    selectedDate = dateOrUndefined;
  }
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Management System Kredit';
  workbook.created = new Date();

  // Parse selected date or use today
  const exportDate = selectedDate ? new Date(selectedDate) : new Date();

  // Create main sheet
  const sheet = workbook.addWorksheet('Input Pembayaran');

  // Title
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'LAPORAN INPUT PEMBAYARAN (BULK)';
  titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
  titleCell.alignment = { horizontal: 'center' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

  // Date info
  sheet.mergeCells('A2:H2');
  const dateCell = sheet.getCell('A2');
  dateCell.value = `Per tanggal: ${exportDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`;
  dateCell.font = { italic: true, size: 12 };
  dateCell.alignment = { horizontal: 'center' };

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

  // Build bulk summary dari handovers (jika tersedia) - ini adalah versi lengkap dengan semua data
  const bulkMap = new Map<string, BulkPaymentSummary>();

  // Jika handovers tersedia, gunakan sebagai sumber utama (termasuk yang sudah lunas)
  if (handovers.length > 0) {
    handovers.forEach((handover) => {
      if (!handover.credit_contracts) return;

      const key = handover.contract_id;
      const currentIndex = handover.credit_contracts.current_installment_index || 0;
<<<<<<< HEAD
      const paidCount = Math.max(0, Math.min(currentIndex, handover.end_index) - handover.start_index + 1);
      const unpaidCount = handover.coupon_count - paidCount;

=======
  const paidCount = Math.max(0, Math.min(currentIndex, handover.end_index) - handover.start_index + 1);
  const unpaidCount = handover.coupon_count - paidCount;
      
>>>>>>> d0a35a3 (Update)
      const dailyAmount = handover.credit_contracts.daily_installment_amount || 0;
      const totalAmount = dailyAmount * paidCount; // Tertagih = kupon dibayar * angsuran

      if (!bulkMap.has(key)) {
        bulkMap.set(key, {
          contractId: handover.contract_id,
          customerName: handover.credit_contracts.customers?.name || '-',
          contractRef: handover.credit_contracts.contract_ref,
          paymentCount: paidCount,
          totalCoupons: handover.coupon_count,
<<<<<<< HEAD
          unpaidCount,
=======
          returnedCoupons: unpaidCount,
>>>>>>> d0a35a3 (Update)
          dailyAmount,
          totalAmount,
        });
      }
    });
  } else {
    // Fallback: gunakan payments data (versi lama untuk backward compatibility)
    payments.forEach((payment) => {
      const contract = contracts.find(c => c.id === payment.contract_id);
      const dailyAmount = contract?.daily_installment_amount || 0;
      const customerName = payment.credit_contracts?.customers?.name || '-';
      const contractRef = payment.credit_contracts?.contract_ref || '-';

      const key = payment.contract_id;
      if (!bulkMap.has(key)) {
        bulkMap.set(key, {
          contractId: payment.contract_id,
          customerName,
          contractRef,
          paymentCount: 0,
          totalCoupons: 0,
<<<<<<< HEAD
          unpaidCount: 0,
=======
          returnedCoupons: 0,
>>>>>>> d0a35a3 (Update)
          dailyAmount,
          totalAmount: 0,
        });
      }

      const summary = bulkMap.get(key)!;
      summary.paymentCount += 1;
      summary.totalCoupons += 1;
      summary.totalAmount += dailyAmount;
    });
  }

  // Convert map to array and sort
  const bulkData = Array.from(bulkMap.values()).sort((a, b) =>
    a.contractRef.localeCompare(b.contractRef)
  );

  // Build rows from bulk summary
  // Cols: No | Konsumen | Kode Kontrak | Pembayaran ke | Kupon Bawa | Kupon Pulang | Angsuran/Kupon | Tertagih
  bulkData.forEach((bulk, i) => {
    const dataRowValues = [
      i + 1,
      bulk.customerName,
      bulk.contractRef,
      bulk.paymentCount,
      bulk.totalCoupons,
<<<<<<< HEAD
      bulk.unpaidCount,
=======
      bulk.returnedCoupons || 0,
>>>>>>> d0a35a3 (Update)
      bulk.dailyAmount,
      bulk.totalAmount,
    ];

    const dataRow = sheet.addRow(dataRowValues);

    dataRow.eachCell((cell, colNumber) => {
      cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };

<<<<<<< HEAD
      if ([4, 5, 6].includes(colNumber)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if ([7, 8].includes(colNumber)) {
=======
      // Format numeric and currency columns
      if ([4, 5, 6].includes(colNumber)) {
        // paymentCount, totalCoupons (Kupon Bawa), returnedCoupons (Kupon Pulang)
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if ([7, 8].includes(colNumber)) {
        // Angsuran and Total Tertagih
>>>>>>> d0a35a3 (Update)
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });
  });

  // Total row
  if (bulkData.length > 0) {
    const endRow = startRow + bulkData.length - 1;
    const totalRowValues = [
      '', '', 'TOTAL',
      { formula: `SUM(D${startRow}:D${endRow})` },
      { formula: `SUM(E${startRow}:E${endRow})` },
      { formula: `SUM(F${startRow}:F${endRow})` },
      '',
      { formula: `SUM(H${startRow}:H${endRow})` },
    ];

    const totalRow = sheet.addRow(totalRowValues);

    totalRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E2F3' } };
      cell.border = { top: { style: 'double' }, bottom: { style: 'double' }, left: { style: 'thin' }, right: { style: 'thin' } };
<<<<<<< HEAD

      if ([4, 5, 6].includes(colNumber)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if ([7, 8].includes(colNumber)) {
=======
      
      if ([4, 5, 6].includes(colNumber)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'center' };
      } else if ([8].includes(colNumber)) {
>>>>>>> d0a35a3 (Update)
        cell.numFmt = '"Rp "#,##0';
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  // Column widths
  sheet.columns = COL_WIDTHS.map((width) => ({ width }));

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Input_Pembayaran_${selectedDate || new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
