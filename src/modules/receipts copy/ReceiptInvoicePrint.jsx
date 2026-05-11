import React, { useEffect, useRef } from "react";
import { Box, Typography } from "@mui/material";

const ReceiptInvoicePrint = ({ invoice, autoPrint = false, copyLabel }) => {
  const printRef = useRef();

  useEffect(() => {
    // Auto trigger print only when explicitly requested (used when rendering in a new window)
    if (autoPrint && typeof window !== "undefined") {
      setTimeout(() => window.print(), 300);
    }
  }, [autoPrint]);

  if (!invoice) return null;

  const formatNumber = (v) =>
    new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v || 0));

  const formatDate = (d) => {
    if (!d) return "-";
    const date = new Date(d);
    return date.toLocaleDateString("en-US");
  };

  const numberToWords = (num) => {
    if (num == null) return "-";
    const n = Number(num) || 0;
    const parts = n.toFixed(2).split('.');
    const intPart = parseInt(parts[0], 10);
    const decPart = parseInt(parts[1], 10);
    const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
    const tens = ["","",'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
    const intToWords = (n) => {
      if (n === 0) return 'Zero';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n/10)] + (n%10 ? ' ' + ones[n%10] : '');
      if (n < 1000) return ones[Math.floor(n/100)] + ' Hundred' + (n%100 ? ' ' + intToWords(n%100) : '');
      return '';
    };
    let w = '';
    const scales = [{v:1e9,s:'Billion'},{v:1e6,s:'Million'},{v:1e3,s:'Thousand'}];
    let rem = intPart;
    for (const s of scales) {
      if (rem >= s.v) {
        const c = Math.floor(rem / s.v);
        w += (w ? ' ' : '') + intToWords(c) + ' ' + s.s;
        rem = rem % s.v;
      }
    }
    if (rem > 0) w += (w ? ' ' : '') + intToWords(rem);
    if (!w) w = 'Zero';
    if (decPart > 0) w += ' and ' + decPart + '/100';
    return w + ' Only';
  };

  // Get project name from invoice (check multiple fields)
  const getProjectName = () => {
    return invoice.Project || 
           invoice.project || 
           invoice.ProjectName || 
           (invoice.lines && invoice.lines[0] && invoice.lines[0].project) ||
           '';
  };

  const projectName = getProjectName();
  const projectUpper = projectName.toString().toUpperCase();
  
  // Determine background image based on project
  let backgroundImage = 'BHUBReceiptFormate.svg'; // default
  
  if (projectUpper.includes('BHU') || projectUpper === 'BHUB') {
    backgroundImage = 'BHUBReceiptFormate.svg';
  } else if (projectUpper.includes('ODN')) {
    backgroundImage = 'ODNReceiptFormate.svg';
  }
  else if (projectUpper.includes('BHO')) {
    backgroundImage = 'BHOReceiptFormate.svg';
  }
  
  // Add more projects as needed:
  // else if (projectUpper.includes('ABC')) {
  //   backgroundImage = 'ABCReceiptFormate.svg';
  // }

  const logoUrl = typeof window !== 'undefined' ? 
    `${window.location.origin}/${backgroundImage}` : 
    `/${backgroundImage}`;

  const DetailRow = ({ label, value, bold = false }) => {
    const isReceiptNo = label === 'Voucher No';
    return (
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1, mb: 0.4 }}>
        <Typography sx={{ width: '34%', fontWeight: 400, fontSize: '15px' }}>{label}:</Typography>
        <Typography
          sx={{ 
            flex: 1, 
            fontWeight: bold ? 600 : 400,
            fontSize: '15px',
            color: '#000'
          }}
        >
          {value || "-"}
        </Typography>
      </Box>
    );
  };

  // derive flexible fields with safe fallbacks
  const regNo = invoice.RegNo || invoice.RegistrationNo || invoice.regNo || invoice.registrationNo || '-';
  const mobile = invoice.Mobile || invoice.mobile || invoice.Phone || invoice.phone || '-';
  const sqft = invoice.SqFt || invoice.Sqft || invoice.sqft || '-';
  const installmentNo = invoice.InstallmentNo || invoice.installmentNo || (invoice.lines && invoice.lines[0] && invoice.lines[0].installmentCode) || '0';
  const status = invoice.ppu || (invoice.lines && invoice.lines[0]?.ppu) || '-';
  
  return (
    <Box 
      ref={printRef} 
      sx={{ 
        padding: 2.5, 
        fontFamily: '"Inter", "Roboto", "Arial"', 
        fontSize: '15px', 
        color: '#000',
        position: 'relative',
        minHeight: '250px',
        backgroundImage: `url(${logoUrl})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top center',
        backgroundSize: '100% auto',
        backgroundColor: 'white',
        '@media print': {
          backgroundImage: `url(${logoUrl})`,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }
      }}
    >
      {/* Copy Label at the top */}
      {copyLabel && (
        <Typography 
          sx={{ 
            textAlign: 'center', 
            fontSize: '12px', 
            color: '#000000', 
            marginTop: '15px',
            marginBottom: '8px',
            textTransform: 'uppercase',
            fontWeight: 600,
            position: 'relative',
            zIndex: 2
          }}
        >
          {copyLabel}
        </Typography>
      )}
      
      {/* Content with padding to avoid overlapping with background */}
      <Box sx={{ 
        position: 'relative', 
        zIndex: 2, 
        paddingTop: '80px', // Adjust based on your background image height
        '@media print': {
          paddingTop: '80px',
        }
      }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2.5, mb: 2.5 }}>
          {/* Left Column */}
          <Box>
            <DetailRow label="Reg No" value={regNo} />
            <DetailRow label="Name" value={invoice.CustomerName}/>
            <DetailRow label="Mobile" value={mobile} />
            <DetailRow label="Receipt Mode" value={invoice.ReceiptMode || '-'} />
            <DetailRow label="Amount" value={formatNumber(invoice.TotalAmount)} />
            <DetailRow label="(in words)" value={numberToWords(invoice.TotalAmount)} />
          </Box>
          {/* Right Column */}
          <Box>
            <DetailRow label="Receipt Date" value={formatDate(invoice.ReceiptDate)} />
            <DetailRow label="Voucher No" value={invoice.VoucherNo} />
            <DetailRow label="Unit" value={invoice.UnitNo || '-'} />
            <DetailRow label="SQ FT" value={sqft} />
            <DetailRow label="Installment No" value={installmentNo} />
            <DetailRow label="Status PPU" value={status} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ReceiptInvoicePrint;