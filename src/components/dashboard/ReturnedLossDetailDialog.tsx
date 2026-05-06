import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatRupiah } from "@/lib/format";
import type { ReturnedLossSummary } from "@/hooks/useReturnedLoss";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data?: ReturnedLossSummary;
}

export function ReturnedLossDetailDialog({ open, onOpenChange, title, data }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* Ringkasan total */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Jumlah Kontrak</p>
              <p className="text-lg font-bold">{data?.returned_count ?? 0}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Total Modal Hilang</p>
              <p className="text-lg font-bold">{formatRupiah(data?.total_modal_loss ?? 0)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Sempat Tertagih</p>
              <p className="text-lg font-bold text-green-600">{formatRupiah(data?.total_collected_back ?? 0)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs text-muted-foreground">Kerugian Bersih</p>
              <p className="text-lg font-bold text-destructive">{formatRupiah(data?.total_loss ?? 0)}</p>
            </div>
          </div>

          {/* Per Sales */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Rekap per Sales</h3>
            <ScrollArea className="max-h-[200px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sales</TableHead>
                    <TableHead className="text-right">Kontrak</TableHead>
                    <TableHead className="text-right">Total Omset</TableHead>
                    <TableHead className="text-right">Tertagih</TableHead>
                    <TableHead className="text-right">Kerugian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.by_sales || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Tidak ada data
                      </TableCell>
                    </TableRow>
                  ) : (
                    data!.by_sales.map((s) => (
                      <TableRow key={s.sales_id || 'none'}>
                        <TableCell>
                          <div className="font-medium">{s.sales_name}</div>
                          {s.sales_code && (
                            <div className="text-xs text-muted-foreground">{s.sales_code}</div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{s.contract_count}</TableCell>
                        <TableCell className="text-right">{formatRupiah(s.total_omset)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatRupiah(s.total_collected)}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">{formatRupiah(s.total_loss)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          {/* Detail per Kontrak */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Detail Kontrak Return</h3>
            <ScrollArea className="max-h-[350px] rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>No. Kontrak</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead className="text-right">Omset</TableHead>
                    <TableHead className="text-right">Tertagih</TableHead>
                    <TableHead className="text-right">Kerugian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.contracts || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        Tidak ada kontrak return
                      </TableCell>
                    </TableRow>
                  ) : (
                    data!.contracts.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(c.start_date), 'dd MMM yyyy', { locale: idLocale })}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{c.contract_ref}</TableCell>
                        <TableCell>{c.customer_name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {c.sales_code ? `${c.sales_code} · ` : ''}{c.sales_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatRupiah(c.omset)}</TableCell>
                        <TableCell className="text-right text-green-600">{formatRupiah(c.collected_back)}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">{formatRupiah(c.loss)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
