import React, { useEffect, useState } from "react";

/** ======= CONFIG (match your DB enums) ======= */
const RECEIPT_TYPE_INSTALLMENT = "INSTALLMENT";
const RECEIPT_TYPE_TAX = "TAX";
const formatAmount = (value) =>
  new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatNumber = (value) => {
  if (value === "" || value === null) return "";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const parseNumber = (value) => {
  return Number(value.replace(/,/g, ""));
};


/** ======= MONEY HELPERS ======= */
function toCents(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}
function fromCents(cents) {
  return Math.round(cents) / 100;
}
function clampNonNeg(n) {
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}
function taxCentsInclusive(grossCents, taxRatePercent) {
  const rate = clampNonNeg(Number(taxRatePercent));
  const bp = Math.round(rate * 100);
  if (bp === 0) return 0;
  return Math.round((grossCents * bp) / (10000 + bp));
}

// const [schedule, setSchedule] = useState([]);

/** ======= ALLOCATION LOGIC ======= */


function generateAllocationsFIFO({
  totalReceipt,
  schedule, // array of rows from API: [{TotalUnpaid, DueDate, InstNo, ...}]
  includeTax,
  taxRatePercent,
}) {
  let remainingGross = toCents(totalReceipt);

  const rate = clampNonNeg(Number(taxRatePercent || 0));
  const grossMultiplier = includeTax ? (100 + rate) / 100 : 1;

  const allocations = []; // each: { scheduleRow, grossCentsAllocated }

  for (const row of schedule) {
    if (remainingGross <= 0) break;

    const dueNet = Number(row.TotalUnpaid || 0);
    if (dueNet <= 0) continue;

    const dueGrossCents = Math.round(toCents(dueNet) * grossMultiplier);

    const allocGross = Math.min(remainingGross, dueGrossCents);
    if (allocGross > 0) {
      allocations.push({ row, grossCents: allocGross });
      remainingGross -= allocGross;
    }
  }

  return allocations;
}


/** ======= BUILD UI ROWS ======= */

function buildRows({ allocations, includeTax, taxRatePercent }) {
  const rows = [];

  for (const alloc of allocations) {
    const { row, grossCents } = alloc;
    const instNo = row.InstNo; // <-- actual installment number from DB

    if (!includeTax) {
      rows.push({
        mapping_id: null,
        code: null,
        receipt_type: RECEIPT_TYPE_INSTALLMENT,
        knocking: null,
        amount: fromCents(grossCents),
        default_surcharge: 0,
        _uiLabel: `Installment ${row.InstNo}`, // for UI
        installment_id: row.InstNo, // <-- real installment number
      });

      continue;
    }

    const tCents = taxCentsInclusive(grossCents, taxRatePercent);
    const netCents = grossCents - tCents;

    rows.push({
      mapping_id: null,
      code: null,
      receipt_type: RECEIPT_TYPE_INSTALLMENT,
      knocking: null,
      amount: fromCents(netCents),
      default_surcharge: 0,
      _uiLabel: `Installment ${row.InstNo} (Net)`,
      installment_id: row.InstNo,
    });
    rows.push({
      mapping_id: null,
      code: null,
      receipt_type: RECEIPT_TYPE_TAX,
      knocking: null,
      amount: fromCents(tCents),
      default_surcharge: 0,
      _uiLabel: `Installment ${row.InstNo} (Tax)`,
      installment_id: row.InstNo,
    });

  }

  return rows;
}


/** ======= MODAL COMPONENT ======= */
export default function AutoAllocateModal({ open, onClose, onApply, defaultTotalReceipt = 0, unitId, }) {
  const [totalReceipt, setTotalReceipt] = useState(defaultTotalReceipt);
  const [schedule, setSchedule] = useState([]); // ✅ FIXED
  const [includeTax, setIncludeTax] = useState(false);
  const [taxRate, setTaxRate] = useState(0);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [generatedRows, setGeneratedRows] = useState([]);

  const totalUnpaidAmount = schedule.reduce(
    (sum, row) => sum + Number(row.TotalUnpaid || 0),
    0
  );
  const remainingUnpaid = Math.max(
    totalUnpaidAmount - Number(totalReceipt || 0),
    0
  );

  /** ======= FIXED useEffect ======= */
  useEffect(() => {
    if (!open || !unitId) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/installment-plan/unpaid-schedule?unitId=${encodeURIComponent(unitId)}`
        );

        const json = await res.json();
        console.log("FIFO schedule:", json);

        if (!cancelled && json.status === "success") {
          setSchedule(Array.isArray(json.data) ? json.data : []);
        }
      } catch (err) {
        console.error("Failed to fetch FIFO schedule:", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, unitId]);





  if (!open) return null;

  const expectedTotal = Number(totalReceipt || 0);
  const previewTotal = generatedRows.reduce(
    (acc, r) => acc + Number(r.amount || 0),
    0
  );
  const diff = Number((previewTotal - expectedTotal).toFixed(2));

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <div style={{ fontWeight: 700 }}>Auto Allocate</div>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.body}>
          {/* INPUT GRID */}
          <div style={styles.grid}>
            <Field label="Total receipt amount">
              {/* <input
                type="number"
                step="0.01"
                value={totalReceipt}
                onChange={(e) => setTotalReceipt(Number(e.target.value))}
                style={styles.input}
              /> */}
              <input
                type="text"
                value={formatNumber(totalReceipt)}
                onChange={(e) => {
                  const rawValue = parseNumber(e.target.value);
                  if (!isNaN(rawValue)) {
                    setTotalReceipt(rawValue);
                  }
                }}
                style={styles.input}
              />

              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                Total Unpaid (All Installments):{" "}
                <b>{formatAmount(totalUnpaidAmount)}</b>
              </div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                Remaining Unpaid After Receipt:{" "}
                <b>{formatAmount(remainingUnpaid)}</b>
              </div>
            </Field>

            <div style={styles.row}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={includeTax}
                  onChange={(e) => setIncludeTax(e.target.checked)}
                />
                Include TAX lines (inclusive tax split)
              </label>
            </div>

            {includeTax && (
              <Field label="Tax rate %">
                <input
                  type="number"
                  step="0.01"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  style={styles.input}
                />
              </Field>
            )}

            <div style={styles.row}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                />
                Replace existing mapping lines
              </label>
            </div>

            <button
              style={{ ...styles.primaryBtn, margin: "0 14px 14px" }}
              onClick={() => {
                if (!schedule.length || totalReceipt <= 0) {
                  setGeneratedRows([]);
                  return;
                }

                // 1️⃣ FIFO allocation
                const allocations = generateAllocationsFIFO({
                  totalReceipt,
                  schedule,
                  includeTax,
                  taxRatePercent: taxRate,
                });

                // 2️⃣ Convert allocations → gross cents list
                const grossLinesCents = allocations.map(a => a.grossCents);
                const rows = buildRows({ allocations, includeTax, taxRatePercent: taxRate });
                // 3️⃣ Build UI rows
                // const rows = buildRows({
                //   grossLinesCents,
                //   includeTax,
                //   taxRatePercent: taxRate,
                // });

                setGeneratedRows(rows);
              }}
            >
              Generate Lines
            </button>

          </div>

          {/* PREVIEW */}
          <div style={styles.preview}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Preview</div>

            <div style={styles.summary}>
              <div>
                Expected: <b>{expectedTotal.toFixed(2)}</b>
              </div>
              <div>
                Generated: <b>{previewTotal.toFixed(2)}</b>
              </div>
              <div>
                Difference: <b>{diff.toFixed(2)}</b>
              </div>
              {diff !== 0 && (
                <div style={styles.warn}>Totals do not match!</div>
              )}
            </div>

            <div style={styles.tableWrap}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>#</th>
                    <th style={styles.th}>ReceiptType</th>
                    <th style={styles.th}>Amount</th>
                    <th style={styles.th}>Adjusted Installment No</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedRows.map((r, idx) => (
                    <tr key={idx}>
                      <td style={styles.td}>{idx + 1}</td>
                      <td style={styles.td}>{r.receipt_type}</td>
                      <td style={styles.td} align="right">
                        {formatAmount(r.amount)}
                      </td>
                      <td style={styles.td}>{r._uiLabel || ""}</td>
                    </tr>
                  ))}
                  {generatedRows.length === 0 && (
                    <tr>
                      <td style={styles.td} colSpan={4}>
                        No rows generated.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <button onClick={onClose} style={styles.secondaryBtn}>
            Cancel
          </button>

          <button
            onClick={() => {
              onApply({
                rows: generatedRows.map(({ _uiLabel, ...row }) => row),
                mode: replaceExisting ? "replace" : "append",
              });
              onClose();
            }}
            style={styles.primaryBtn}
            disabled={generatedRows.length === 0 || diff !== 0}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/** ===== SMALL UI COMPONENT ===== */
function Field({ label, children }) {
  return (
    <div style={styles.field}>
      <div style={styles.label}>{label}</div>
      {children}
    </div>
  );
}

/** ===== STYLES ===== */
const styles = {
  body: { overflowY: "auto", flex: 1 },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    zIndex: 9999,
  },
  modal: {
    width: "min(900px, 100%)",
    maxHeight: "90vh",
    background: "#111",
    color: "#fff",
    borderRadius: 12,
    border: "1px solid #2a2a2a",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: 14,
    borderBottom: "1px solid #2a2a2a",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#fff",
    fontSize: 18,
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 12,
    padding: 14,
    borderBottom: "1px solid #2a2a2a",
  },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, opacity: 0.85 },
  input: {
    padding: 10,
    borderRadius: 10,
    border: "1px solid #2a2a2a",
    background: "#0b0b0b",
    color: "#fff",
  },
  row: { gridColumn: "1 / -1" },
  checkboxLabel: { display: "flex", gap: 10 },
  preview: { padding: 14 },
  summary: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
    marginBottom: 10,
  },
  warn: { gridColumn: "1 / -1", color: "#ff0" },
  tableWrap: { border: "1px solid #2a2a2a", borderRadius: 12 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: 10, background: "#0b0b0b" },
  td: { padding: 10, borderBottom: "1px solid #1e1e1e" },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    padding: 14,
    borderTop: "1px solid #2a2a2a",
  },
  secondaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #2a2a2a",
    background: "transparent",
    color: "#fff",
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 10,
    background: "#2a62ff",
    border: "1px solid #2a2a2a",
    color: "#fff",
  },
};
