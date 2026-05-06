/**
 * Contract-basis (accrual) financial calculation helpers.
 *
 * Berbeda dengan cash basis, di sini omset/modal/profit diakui PENUH
 * pada saat kontrak dibuat (bukan menunggu pembayaran).
 *
 *   omset_full   = total_loan_amount  (harga jual / nilai kontrak)
 *   modal_full   = omset (kolom DB)   (harga modal/pokok)
 *   profit_full  = omset_full - modal_full
 *
 * Periode (bulan/tahun) ditentukan dari `start_date` kontrak.
 */

export interface ContractBasisInput {
  contract_id: string;
  modal_full: number;
  omset_full: number;
}

export interface ContractBasisResult {
  contract_id: string;
  modal: number;
  omset: number;
  profit: number;
}

export const computeContractFull = (c: ContractBasisInput): ContractBasisResult => ({
  contract_id: c.contract_id,
  modal: c.modal_full,
  omset: c.omset_full,
  profit: c.omset_full - c.modal_full,
});
