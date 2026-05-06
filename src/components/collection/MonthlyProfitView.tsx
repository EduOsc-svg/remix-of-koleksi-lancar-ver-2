import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Wallet, Coins, Receipt, Download } from "lucide-react";
import { usePayments } from "@/hooks/usePayments";
import { useContracts } from "@/hooks/useContracts";
import { formatRupiah, formatDate } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";

interface DailyProfit {
  date: string;
  coupons: number;
  collected: number;
  modal: number;
  profit: number;
  margin: number;
  contracts: Array<{
    contract_id: string;
    contract_ref: string;
    customer_name: string;
    coupons: number;
    amount: number;
    profit: number;
  }>;
}

export function MonthlyProfitView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<DailyProfit | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthStr = format(currentDate, "yyyy-MM");

  // Get all payments for the month
  const { data: payments, isLoading: paymentsLoading } = usePayments(
    format(monthStart, "yyyy-MM-dd"),
    format(monthEnd, "yyyy-MM-dd")
  );
  const { data: contracts, isLoading: contractsLoading } = useContracts();

  const isLoading = paymentsLoading || contractsLoading;

  // Build contract map
  const contractMap = useMemo(() => {
    const map = new Map<string, {
      contract_ref: string;
      customer_name: string;
      tenor_days: number;
      total_loan_amount: number;
      modal_total: number;
      profit_total: number;
      profit_per_coupon: number;
      modal_per_coupon: number;
    }>();
    (contracts || []).forEach((c: any) => {
      const omsetTotal = Number(c.total_loan_amount || 0);
      const modalTotal = Number(c.omset || 0);
      const profitTotal = omsetTotal - modalTotal;
      const tenor = Number(c.tenor_days || 0) || 1;
      map.set(c.id, {
        contract_ref: c.contract_ref,
        customer_name: c.customers?.name || "-",
        tenor_days: tenor,
        total_loan_amount: omsetTotal,
        modal_total: modalTotal,
        profit_total: profitTotal,
        profit_per_coupon: profitTotal / tenor,
        modal_per_coupon: modalTotal / tenor,
      });
    });
    return map;
  }, [contracts]);

  // Calculate daily profits
  const dailyProfits = useMemo(() => {
    const map = new Map<string, DailyProfit>();
    
    // Initialize all days in month
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    days.forEach(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      map.set(dateStr, {
        date: dateStr,
        coupons: 0,
        collected: 0,
        modal: 0,
        profit: 0,
        margin: 0,
        contracts: [],
      });
    });

    // Aggregate payments
    (payments || []).forEach((p: any) => {
      const info = contractMap.get(p.contract_id);
      if (!info) return;

      const dateStr = p.payment_date || format(new Date(p.created_at), "yyyy-MM-dd");
      const daily = map.get(dateStr);
      if (!daily) return;

      const amount = Number(p.amount_paid || 0);
      const profitPortion = info.profit_per_coupon;
      const modalPortion = info.modal_per_coupon;

      daily.coupons += 1;
      daily.collected += amount;
      daily.modal += modalPortion;
      daily.profit += profitPortion;

      // Add to contracts array
      const existingContract = daily.contracts.find(c => c.contract_id === p.contract_id);
      if (existingContract) {
        existingContract.coupons += 1;
        existingContract.amount += amount;
        existingContract.profit += profitPortion;
      } else {
        daily.contracts.push({
          contract_id: p.contract_id,
          contract_ref: info.contract_ref,
          customer_name: info.customer_name,
          coupons: 1,
          amount,
          profit: profitPortion,
        });
      }
    });

    // Calculate margin
    map.forEach(daily => {
      daily.margin = daily.collected > 0 ? (daily.profit / daily.collected) * 100 : 0;
    });

    return map;
  }, [payments, contractMap]);

  // Monthly summary
  const monthlySummary = useMemo(() => {
    let totalCoupons = 0;
    let totalCollected = 0;
    let totalModal = 0;
    let totalProfit = 0;
    let totalDays = 0;

    dailyProfits.forEach(daily => {
      if (daily.profit > 0 || daily.coupons > 0) {
        totalDays += 1;
      }
      totalCoupons += daily.coupons;
      totalCollected += daily.collected;
      totalModal += daily.modal;
      totalProfit += daily.profit;
    });

    const avgDaily = totalDays > 0 ? totalProfit / totalDays : 0;
    const margin = totalCollected > 0 ? (totalProfit / totalCollected) * 100 : 0;

    return {
      totalCoupons,
      totalCollected,
      totalModal,
      totalProfit,
      totalDays,
      avgDaily,
      margin,
    };
  }, [dailyProfits]);

  // Days array for calendar
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get performance level color
  const getProfitLevel = (profit: number, maxProfit: number) => {
    if (profit === 0) return "gray";
    const ratio = profit / maxProfit;
    if (ratio >= 0.7) return "green"; // Good
    if (ratio >= 0.4) return "yellow"; // Medium
    return "red"; // Low
  };

  const maxDailyProfit = useMemo(() => {
    let max = 0;
    dailyProfits.forEach(daily => {
      if (daily.profit > max) max = daily.profit;
    });
    return max || 1;
  }, [dailyProfits]);

  // Export to Excel
  const handleExportExcel = () => {
    const data: any[] = [
      ["Keuntungan Harian - " + format(currentDate, "MMMM yyyy", { locale: id })],
      [],
      ["Tanggal", "Kupon", "Tertagih", "Modal", "Keuntungan", "Margin %"],
    ];

    days.forEach(day => {
      const dateStr = format(day, "yyyy-MM-dd");
      const daily = dailyProfits.get(dateStr);
      if (daily && (daily.coupons > 0 || daily.profit > 0)) {
        data.push([
          format(day, "dd MMM yyyy", { locale: id }),
          daily.coupons,
          daily.collected,
          daily.modal,
          daily.profit,
          daily.margin.toFixed(2),
        ]);
      }
    });

    data.push([]);
    data.push([
      "TOTAL",
      monthlySummary.totalCoupons,
      monthlySummary.totalCollected,
      monthlySummary.totalModal,
      monthlySummary.totalProfit,
      monthlySummary.margin.toFixed(2),
    ]);

    // Simple CSV export
    const csv = data.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `keuntungan-harian-${monthStr}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header & Month Navigation */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Keuntungan Harian Per Bulan
              </CardTitle>
              <CardDescription>
                Visualisasi keuntungan harian dengan breakdown per tanggal dan kontrak
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="gap-2"
              disabled={isLoading}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold min-w-[150px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: id })}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Receipt className="h-4 w-4" />
              Total Kupon
            </div>
            <div className="text-2xl font-bold">{monthlySummary.totalCoupons}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calendar className="h-4 w-4" />
              Hari Aktif
            </div>
            <div className="text-2xl font-bold">{monthlySummary.totalDays}</div>
            <div className="text-xs text-muted-foreground mt-1">dari {days.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Wallet className="h-4 w-4" />
              Total Tertagih
            </div>
            <div className="text-2xl font-bold">{formatRupiah(monthlySummary.totalCollected)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="h-4 w-4" />
              Total Profit
            </div>
            <div className="text-2xl font-bold text-green-600">
              {formatRupiah(monthlySummary.totalProfit)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Margin {monthlySummary.margin.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Coins className="h-4 w-4" />
              Rata-rata Harian
            </div>
            <div className="text-2xl font-bold">
              {formatRupiah(monthlySummary.avgDaily)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Calendar Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Kalender Keuntungan Harian</CardTitle>
          <CardDescription>
            Klik pada tanggal untuk melihat detail kontrak yang membayar
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
          ) : (
            <div className="space-y-4">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-xs pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500" />
                  <span>Bagus (70%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-yellow-500" />
                  <span>Sedang (40-70%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>Rendah (&lt;40%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-gray-300" />
                  <span>Tidak Ada Data</span>
                </div>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(day => (
                  <div key={day} className="text-center font-semibold text-sm text-muted-foreground">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-2">
                {Array(monthStart.getDay())
                  .fill(null)
                  .map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                  ))}

                {days.map(day => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const daily = dailyProfits.get(dateStr) || {
                    date: dateStr,
                    coupons: 0,
                    collected: 0,
                    modal: 0,
                    profit: 0,
                    margin: 0,
                    contracts: [],
                  };

                  const level = getProfitLevel(daily.profit, maxDailyProfit);
                  const bgColor =
                    level === "green"
                      ? "bg-green-100 hover:bg-green-200"
                      : level === "yellow"
                        ? "bg-yellow-100 hover:bg-yellow-200"
                        : level === "red"
                          ? "bg-red-100 hover:bg-red-200"
                          : "bg-gray-100 hover:bg-gray-200";

                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDay(daily)}
                      className={`aspect-square rounded-lg p-2 text-left text-sm transition-colors cursor-pointer border ${bgColor} border-transparent hover:border-primary`}
                    >
                      <div className="font-semibold">{format(day, "d")}</div>
                      {daily.coupons > 0 && (
                        <>
                          <div className="text-xs font-medium text-primary mt-1">
                            {formatRupiah(daily.profit)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {daily.coupons} kupon
                          </div>
                        </>
                      )}
                      {daily.coupons === 0 && (
                        <div className="text-xs text-muted-foreground">-</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={!!selectedDay} onOpenChange={() => setSelectedDay(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Detail Keuntungan — {selectedDay ? format(new Date(selectedDay.date), "dd MMMM yyyy", { locale: id }) : ""}
            </DialogTitle>
            <DialogDescription>
              Rincian per kontrak yang membayar pada tanggal ini
            </DialogDescription>
          </DialogHeader>

          {selectedDay && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-4 gap-2">
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Kupon</div>
                  <div className="text-lg font-bold">{selectedDay.coupons}</div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Tertagih</div>
                  <div className="text-sm font-bold">{formatRupiah(selectedDay.collected)}</div>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <div className="text-xs text-muted-foreground">Modal</div>
                  <div className="text-sm font-bold">{formatRupiah(selectedDay.modal)}</div>
                </div>
                <div className="rounded-lg bg-green-100 p-3">
                  <div className="text-xs text-muted-foreground">Profit</div>
                  <div className="text-lg font-bold text-green-600">
                    {formatRupiah(selectedDay.profit)}
                  </div>
                </div>
              </div>

              {/* Contracts List */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Kontrak yang Membayar:</h4>
                {selectedDay.contracts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Tidak ada pembayaran</p>
                ) : (
                  <div className="space-y-2">
                    {selectedDay.contracts.map(contract => (
                      <div
                        key={contract.contract_id}
                        className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <div className="font-mono text-sm font-semibold">{contract.contract_ref}</div>
                          <div className="text-sm text-muted-foreground">{contract.customer_name}</div>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {contract.coupons} kupon
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-muted-foreground">
                            {formatRupiah(contract.amount)}
                          </div>
                          <div className="text-sm font-semibold text-green-600 mt-1">
                            {formatRupiah(contract.profit)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
