# Fix: Hapus Export Per Sales pada Tab Input Pembayaran

## 📋 Ringkasan
Menghapus fitur "Export Per Sales (Legacy)" dari tab "Input Pembayaran" pada halaman Collection, karena fitur ini sudah diganti dengan "Export Per Kolektor" yang lebih modern.

## 🔧 Perubahan yang Dilakukan

### File: `src/pages/Collection.tsx`

#### Perubahan 1: Hapus Import
```diff
- import { exportPaymentPerSalesExcel } from "@/lib/exportPaymentPerSales";
  import { exportHandoverPerCollectorDaily } from "@/lib/exportHandoverPerCollectorDaily";
  import { exportPaymentPerCollectorDaily } from "@/lib/exportPaymentPerCollectorDaily";
```

#### Perubahan 2: Hapus Tombol UI
```diff
  </Button>
- <Button 
-   variant="outline" 
-   onClick={() => {
-     if (!payments || payments.length === 0) {
-       toast.error("Tidak ada data pembayaran untuk diexport");
-       return;
-     }
-     try {
-       exportPaymentPerSalesExcel(payments, contracts || [], salesAgents || []);
-       toast.success("Export pembayaran per sales berhasil");
-     } catch (error) {
-       toast.error("Gagal export pembayaran per sales");
-       console.error(error);
-     }
-   }}
-   disabled={paymentsLoading}
- >
-   <Download className="mr-2 h-4 w-4" /> Export Per Sales (Legacy)
- </Button>
  <Button