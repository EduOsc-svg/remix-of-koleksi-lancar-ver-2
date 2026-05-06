import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Users, TrendingUp, Coins, Target, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { formatRupiah } from "@/lib/format";
import {
  useCollectorDailyPerformance,
  useCollectorMonthlyPerformance,
} from "@/hooks/useCollectorDailyPerformance";

function rateBadge(rate: number) {
  if (rate >= 90) return <Badge className="bg-green-600 hover:bg-green-600">Sangat Baik</Badge>;
  if (rate >= 75) return <Badge className="bg-blue-600 hover:bg-blue-600">Baik</Badge>;
  if (rate >= 50) return <Badge className="bg-yellow-600 hover:bg-yellow-600">Cukup</Badge>;
  if (rate > 0) return <Badge variant="destructive">Kurang</Badge>;
  return <Badge variant="secondary">-</Badge>;
}

export function CollectorDailyPerformance() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: daily, isLoading: dailyLoading } = useCollectorDailyPerformance(selectedDate);
  const { data: monthly, isLoading: monthlyLoading } = useCollectorMonthlyPerformance(currentMonth);

  return (
    <Tabs defaultValue="daily" className="w-full">
      <TabsList>
        <TabsTrigger value="daily">Harian</TabsTrigger>
        <TabsTrigger value="monthly">Bulanan (Bonus)</TabsTrigger>
      </TabsList>

      {/* DAILY */}
      <TabsContent value="daily" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Performa Kolektor Harian
            </CardTitle>
            <CardDescription>
              Ringkasan penagihan & persentase keberhasilan per kolektor (acuan bonus harian)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <div>
                <Label htmlFor="date">Tanggal</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-48"
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => setSelectedDate(today)}>
                Hari Ini
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Coins className="h-4 w-4" /> Total Tertagih
                  </div>
                  <div className="text-xl font-bold mt-1">{formatRupiah(daily?.total_amount || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Target className="h-4 w-4" /> Total Tagihan
                  </div>
                  <div className="text-xl font-bold mt-1">{formatRupiah(daily?.total_handed_amount || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <TrendingUp className="h-4 w-4" /> Kupon Tertagih
                  </div>
                  <div className="text-xl font-bold mt-1">{daily?.total_coupons_collected || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Target className="h-4 w-4" /> Kupon Dipegang
                  </div>
                  <div className="text-xl font-bold mt-1">{daily?.total_coupons_handed || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" /> Rata-rata Keberhasilan
                  </div>
                  <div className="text-xl font-bold mt-1">
                    {(daily?.avg_success_rate || 0).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Kolektor</TableHead>
                    <TableHead className="text-right">Kupon Dipegang</TableHead>
                    <TableHead className="text-right">Kupon Tertagih</TableHead>
                    <TableHead className="text-right">Kontrak</TableHead>
                    <TableHead className="text-right">Total Tagihan</TableHead>
                    <TableHead className="text-right">Total Tertagih</TableHead>
                    <TableHead className="w-48">Keberhasilan</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyLoading ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Memuat...</TableCell></TableRow>
                  ) : (daily?.rows.length || 0) === 0 ? (
                    <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground">Tidak ada aktivitas kolektor di tanggal ini</TableCell></TableRow>
                  ) : (
                    daily!.rows.map((r) => (
                      <TableRow key={r.collector_id}>
                        <TableCell className="font-mono text-xs">{r.collector_code}</TableCell>
                        <TableCell className="font-medium">{r.collector_name}</TableCell>
                        <TableCell className="text-right">{r.coupons_handed_over}</TableCell>
                        <TableCell className="text-right">{r.coupons_collected}</TableCell>
                        <TableCell className="text-right">{r.unique_contracts}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatRupiah(r.amount_handed)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatRupiah(r.amount_collected)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(100, r.success_rate)} className="h-2" />
                            <span className="text-xs w-12 text-right">{r.success_rate.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{rateBadge(r.success_rate)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* MONTHLY */}
      <TabsContent value="monthly" className="space-y-4 mt-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" /> Performa Kolektor Bulanan
            </CardTitle>
            <CardDescription>
              Akumulasi bulan berjalan (reset tgl 1) — acuan bonus bulanan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-semibold min-w-[160px] text-center">
                {format(currentMonth, "MMMM yyyy", { locale: idLocale })}
              </div>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentMonth(new Date())}>
                Bulan Ini
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <Card>
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm">Total Tertagih</div>
                  <div className="text-xl font-bold mt-1">{formatRupiah(monthly?.total_amount || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm">Total Tagihan</div>
                  <div className="text-xl font-bold mt-1">{formatRupiah(monthly?.total_handed_amount || 0)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm">Kupon Tertagih</div>
                  <div className="text-xl font-bold mt-1">{monthly?.total_coupons_collected || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm">Kupon Dipegang</div>
                  <div className="text-xl font-bold mt-1">{monthly?.total_coupons_handed || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-muted-foreground text-sm">Rata-rata Keberhasilan</div>
                  <div className="text-xl font-bold mt-1">{(monthly?.avg_success_rate || 0).toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Kolektor</TableHead>
                    <TableHead className="text-right">Hari Aktif</TableHead>
                    <TableHead className="text-right">Kupon Dipegang</TableHead>
                    <TableHead className="text-right">Kupon Tertagih</TableHead>
                    <TableHead className="text-right">Kontrak</TableHead>
                    <TableHead className="text-right">Total Tagihan</TableHead>
                    <TableHead className="text-right">Total Tertagih</TableHead>
                    <TableHead className="w-48">Keberhasilan</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyLoading ? (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Memuat...</TableCell></TableRow>
                  ) : (monthly?.rows.length || 0) === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Tidak ada aktivitas kolektor di bulan ini</TableCell></TableRow>
                  ) : (
                    monthly!.rows.map((r) => (
                      <TableRow key={r.collector_id}>
                        <TableCell className="font-mono text-xs">{r.collector_code}</TableCell>
                        <TableCell className="font-medium">{r.collector_name}</TableCell>
                        <TableCell className="text-right">{r.active_days}</TableCell>
                        <TableCell className="text-right">{r.coupons_handed_over}</TableCell>
                        <TableCell className="text-right">{r.coupons_collected}</TableCell>
                        <TableCell className="text-right">{r.unique_contracts}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatRupiah(r.amount_handed)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatRupiah(r.amount_collected)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(100, r.success_rate)} className="h-2" />
                            <span className="text-xs w-12 text-right">{r.success_rate.toFixed(0)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{rateBadge(r.success_rate)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
