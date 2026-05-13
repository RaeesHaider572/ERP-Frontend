import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box, Card, CardContent, CardActionArea, Typography,
  Skeleton, Tooltip, IconButton, TextField, InputAdornment,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { getBankBalances } from "../../services/cashAndBankService";

// ── Helpers ───────────────────────────────────────────────────────────────
const fPKR = (v) =>
  Math.round(Number(v) || 0).toLocaleString("en-PK");

// const todayStr = () => new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

// ══════════════════════════════════════════════════════════════════════════════
export default function BankBalances({
  title = "Bank Balances",
  compact = false,
  onBankClick,
}) {
  const [rows,      setRows]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [refreshed, setRefreshed] = useState(Date.now());
  const [search,    setSearch]    = useState("");

  const fetchBalances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res  = await getBankBalances();
      const data = Array.isArray(res.data?.data) ? res.data.data
                 : Array.isArray(res.data)        ? res.data
                 : [];
      setRows(data);
      setRefreshed(Date.now());
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load balances.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBalances(); }, [fetchBalances]);

  // ── Filter rows by search ─────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.BankNameCashName || "").toLowerCase().includes(q)
    );
  }, [rows, search]);

  // ── Today's txn count per row ─────────────────────────────────────────
  // Expects the API to return TodayTxnCount or falls back to 0.
  // If your API returns all-time TxnCount only, swap field name here.
  const getTodayTxns = (row) => Number(row.TodayTxnCount ?? 0);

  // ── Loading ───────────────────────────────────────────────────────────
  if (loading) return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Skeleton variant="text" width={120} height={20} />
        <Skeleton variant="circular" width={24} height={24} />
      </Box>
      <Skeleton variant="rounded" height={36} sx={{ borderRadius: 1.5 }} />
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} variant="rounded" height={compact ? 56 : 80} sx={{ borderRadius: 1.5 }} />
      ))}
    </Box>
  );

  // ── Error ─────────────────────────────────────────────────────────────
  if (error) return (
    <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "error.lighter", border: "1px solid", borderColor: "error.light" }}>
      <Typography variant="body2" color="error.main" fontWeight={600}>⚠ {error}</Typography>
      <Typography
        variant="caption" color="error.main"
        sx={{ cursor: "pointer", textDecoration: "underline" }}
        onClick={fetchBalances}
      >
        Retry
      </Typography>
    </Box>
  );

  // ── Main render ───────────────────────────────────────────────────────
  return (
    <Box>

      {/* ── Header ── */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Box>
          <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1.2, color: "text.secondary", lineHeight: 1 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: "block" }}>
            {filteredRows.length}
            {search && rows.length !== filteredRows.length ? ` of ${rows.length}` : ""}
            {" "}account{filteredRows.length !== 1 ? "s" : ""}
          </Typography>
        </Box>
        <Tooltip title={`Last refreshed: ${new Date(refreshed).toLocaleTimeString()}`}>
          <IconButton size="small" onClick={fetchBalances}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* ── Search box ── */}
      {rows.length > 0 && (
        <TextField
          size="small"
          fullWidth
          placeholder="Search bank / cash…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1.5, "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: "0.8rem" } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearch("")} edge="end">
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
      )}

      {/* ── Total balance strip ── */}
      {/* {filteredRows.length > 0 && (
        <Box sx={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          px: 1.5, py: 1, mb: 1.5,
          borderRadius: 1.5, border: "1px solid", borderColor: "divider",
          bgcolor: "action.hover",
        }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            TOTAL BALANCE
          </Typography>
          <Typography
            variant="body2" fontWeight={700}
            color={filteredRows.reduce((s, r) => s + (Number(r.CurrentBalance) || 0), 0) >= 0 ? "text.primary" : "error.main"}
            sx={{ fontFamily: "'Courier New', monospace" }}
          >
            {(() => {
              const t = filteredRows.reduce((s, r) => s + (Number(r.CurrentBalance) || 0), 0);
              return `${t < 0 ? "−" : ""}Rs. ${Math.abs(Math.round(t)).toLocaleString("en-PK")}`;
            })()}
          </Typography>
        </Box>
      )} */}

      {/* ── No search results ── */}
      {filteredRows.length === 0 && rows.length > 0 && (
        <Box sx={{ py: 3, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            No account matching <strong>"{search}"</strong>
          </Typography>
          <Typography
            variant="caption" color="primary.main"
            sx={{ cursor: "pointer", textDecoration: "underline" }}
            onClick={() => setSearch("")}
          >
            Clear search
          </Typography>
        </Box>
      )}

      {/* ── Empty state ── */}
      {rows.length === 0 && (
        <Box sx={{ py: 3, textAlign: "center", color: "text.secondary" }}>
          <Typography variant="body2">No bank accounts found.</Typography>
        </Box>
      )}

      {/* ── Bank cards ── */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {filteredRows.map((row) => {
          const balance    = Number(row.CurrentBalance) || 0;
          const positive   = balance >= 0;
          const todayTxns  = getTodayTxns(row);
          const Wrapper    = onBankClick ? CardActionArea : Box;

          return (
            <Card
              key={row.BankNameCashName}
              variant="outlined"
              sx={{ borderRadius: 1.5 }}
            >
              <Wrapper
                onClick={onBankClick ? () => onBankClick(row.BankNameCashName) : undefined}
                sx={{ display: "block" }}
              >
                <CardContent sx={{ p: compact ? "10px 14px !important" : "12px 16px !important" }}>

                  {/* Account name */}
                  <Typography
                    variant={compact ? "caption" : "body2"}
                    color="text.secondary"
                    fontWeight={600}
                    noWrap
                    sx={{ mb: 0.5 }}
                  >
                    {row.BankNameCashName || "—"}
                  </Typography>

                  {/* Balance */}
                  <Tooltip
                    title={`Current Balance: Rs. ${Math.round(Math.abs(balance)).toLocaleString("en-PK")} ${positive ? "(Credit)" : "(Debit)"}`}
                    placement="top"
                    arrow
                  >
                    <Typography
                      variant={compact ? "body2" : "h6"}
                      fontWeight={700}
                      color={positive ? "text.primary" : "error.main"}
                      sx={{ fontFamily: "'Courier New', monospace", lineHeight: 1, width: "fit-content" }}
                    >
                      {positive ? "" : "−"}Rs. {fPKR(Math.abs(balance))}
                    </Typography>
                  </Tooltip>

                  {/* Today's txn count + Last txn date */}
                  {!compact && (
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
                      <Tooltip title={`Total transactions recorded today (${new Date().toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" })})`} placement="bottom" arrow>
                        <Typography variant="caption" color="text.disabled" sx={{ cursor: "default" }}>
                          Today's txns: {todayTxns.toLocaleString()}
                        </Typography>
                      </Tooltip>
                      {row.LastTxnDate && (
                        <Tooltip title={`Last transaction on ${new Date(row.LastTxnDate).toLocaleDateString("en-PK", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}`} placement="bottom" arrow>
                          <Typography variant="caption" color="text.disabled" sx={{ cursor: "default" }}>
                            Last: {new Date(row.LastTxnDate).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "2-digit" })}
                          </Typography>
                        </Tooltip>
                      )}
                    </Box>
                  )}

                </CardContent>
              </Wrapper>
            </Card>
          );
        })}
      </Box>

    </Box>
  );
}