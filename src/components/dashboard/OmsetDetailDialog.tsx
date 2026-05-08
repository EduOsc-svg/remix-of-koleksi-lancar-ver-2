import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import type { OmsetDetailsSummary } from "@/hooks/useOmsetDetails";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data?: OmsetDetailsSummary;
}

export function OmsetDetailDialog({ open, onOpenChange, title, data }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Jumlah Kontrak</p>
              <p className="text-lg font-bold">{data?.contracts_count ?? 0}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Total Modal</p>
              <p className="text-lg font-bold text-blue-600">{formatRupiah(data?.total_modal ?? 0)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Total DP</p>
              <p className="text-lg font-bold text-orange-600">{formatRupiah(data?.total_dp ?? 0)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Total Omset</p>
              <p className="text-lg font-bold text-indigo-600">{formatRupiah(data?.total_omset ?? 0)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Keuntungan Kotor</p>
              <p className="text-lg font-bold text-green-600">{formatRupiah(data?.total_profit ?? 0)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Rekap per Sales</h3>
            <div className="rounded-md border max-h-[260px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Sales</TableHead>
                    <TableHead className="text-right">Kontrak</TableHead>
                    <TableHead className="text-right">Modal</TableHead>
                    <TableHead className="text-right">Omset</TableHead>
                    <TableHead className="text-right">Keuntungan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.by_sales || []).length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Tidak ada data</TableCell></TableRow>
                  ) : data!.by_sales.map((s) => (
                    <TableRow key={s.sales_id || 'none'}>
                      <TableCell>
                        <div className="font-medium">{s.sales_name}</div>
                        {s.sales_code !== '-' && <div className="text-xs text-muted-foreground">{s.sales_code}</div>}
                      </TableCell>
                      <TableCell className="text-right">{s.contract_count}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatRupiah(s.total_modal)}</TableCell>
                      <TableCell className="text-right text-indigo-600">{formatRupiah(s.total_omset)}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">{formatRupiah(s.total_profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Detail Kontrak (urut omset terbesar)</h3>
            <div className="rounded-md border max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No. Kontrak</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead className="text-right">Modal</TableHead>
                    <TableHead className="text-right">DP</TableHead>
                    <TableHead className="text-right">Omset</TableHead>
                    <TableHead className="text-right">Keuntungan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.contracts || []).length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Tidak ada kontrak</TableCell></TableRow>
                  ) : data!.contracts.map((c) => (
                    <TableRow key={c.contract_id}>
                      <TableCell className="whitespace-nowrap">{format(new Date(c.start_date), 'dd MMM yyyy', { locale: idLocale })}</TableCell>
                      <TableCell className="font-mono text-xs">{c.contract_ref}</TableCell>
                      <TableCell>
                        <div className="font-medium">{c.customer_name}</div>
                        {c.customer_phone && <div className="text-xs text-muted-foreground">{c.customer_phone}</div>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{c.sales_code !== '-' ? `${c.sales_code} · ` : ''}{c.sales_name}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-blue-600">{formatRupiah(c.modal)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatRupiah(c.dp ?? 0)}</TableCell>
                      <TableCell className="text-right text-indigo-600">{formatRupiah(c.omset)}</TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">{formatRupiah(c.profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}