import api from "./authService";

export const getCashAndBank        = ()         => api.get("/cash-and-bank");
export const getCashAndBankById    = (id)       => api.get(`/cash-and-bank/${id}`);
export const createCashAndBank     = (data)     => api.post("/cash-and-bank", data);
export const updateCashAndBank     = (id, data) => api.put(`/cash-and-bank/${id}`, data);
export const deleteCashAndBank     = (id)       => api.delete(`/cash-and-bank/${id}`);

// ── Bank Balances ──────────────────────────────────────────────────────────────
export const getBankBalances = () => api.get("/cash-and-bank/bank-balances");

// ── Bulk Import ──────────────────────────────────────────────────────────────
export const bulkImportCashAndBank = (formData) =>
  api.post("/cash-and-bank/bulk-import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ── Export Excel ─────────────────────────────────────────────────────────────
export const exportCashAndBank = async () => {
  const response = await api.get("/cash-and-bank/export", {
    responseType: "blob", // important: receive binary file
  });

  // Extract filename from Content-Disposition header if available
  const disposition = response.headers["content-disposition"] || "";
  const match       = disposition.match(/filename="(.+?)"/);
  const filename    = match ? match[1] : `CashAndBank_${new Date().toISOString().split("T")[0]}.xlsx`;

  // Trigger browser download
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href  = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};