class ReceiptGenerator {
    // Generate receipt HTML
    static generateReceiptHTML(paymentData) {
        const date = new Date(paymentData.paid_at || paymentData.created_at).toLocaleDateString('en-NG', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        const time = new Date(paymentData.paid_at || paymentData.created_at).toLocaleTimeString('en-NG');
        
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receipt - ${paymentData.reference}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Playfair+Display:wght@700&display=swap');
                
                * { margin: 0; padding: 0; box-sizing: border-box; }
                
                body {
                    font-family: 'Inter', sans-serif;
                    background: #f5f5f5;
                    padding: 20px;
                }
                
                .receipt-container {
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border: 2px solid #D4AF37;
                    padding: 40px;
                    position: relative;
                }
                
                .watermark {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(-45deg);
                    font-size: 80px;
                    color: rgba(212, 175, 55, 0.1);
                    font-family: 'Playfair Display', serif;
                    pointer-events: none;
                    z-index: 0;
                }
                
                .header {
                    text-align: center;
                    border-bottom: 2px solid #D4AF37;
                    padding-bottom: 20px;
                    margin-bottom: 30px;
                    position: relative;
                    z-index: 1;
                }
                
                .logo {
                    width: 60px;
                    height: 60px;
                    border: 3px solid #D4AF37;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 15px;
                    font-family: 'Playfair Display', serif;
                    font-size: 32px;
                    color: #D4AF37;
                    font-weight: bold;
                }
                
                .school-name {
                    font-family: 'Playfair Display', serif;
                    font-size: 24px;
                    color: #0A0F1E;
                    margin-bottom: 5px;
                }
                
                .school-address {
                    font-size: 12px;
                    color: #666;
                    line-height: 1.5;
                }
                
                .receipt-title {
                    background: #0A0F1E;
                    color: #D4AF37;
                    text-align: center;
                    padding: 10px;
                    margin: 20px 0;
                    font-weight: bold;
                    letter-spacing: 3px;
                    position: relative;
                    z-index: 1;
                }
                
                .receipt-details {
                    margin-bottom: 30px;
                    position: relative;
                    z-index: 1;
                }
                
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px dashed #ddd;
                }
                
                .detail-label {
                    color: #666;
                    font-weight: 600;
                }
                
                .detail-value {
                    color: #0A0F1E;
                    font-weight: 600;
                }
                
                .amount-section {
                    background: #f9f9f9;
                    border: 1px solid #D4AF37;
                    padding: 20px;
                    margin: 20px 0;
                    position: relative;
                    z-index: 1;
                }
                
                .amount-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                }
                
                .amount-row.total {
                    border-top: 2px solid #D4AF37;
                    margin-top: 10px;
                    padding-top: 15px;
                    font-size: 18px;
                    font-weight: bold;
                    color: #0A0F1E;
                }
                
                .status-badge {
                    display: inline-block;
                    background: #22c55e;
                    color: white;
                    padding: 5px 15px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: bold;
                    text-transform: uppercase;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    font-size: 11px;
                    color: #666;
                    position: relative;
                    z-index: 1;
                }
                
                .qr-code {
                    width: 80px;
                    height: 80px;
                    background: #f0f0f0;
                    margin: 15px auto;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    color: #999;
                }
                
                .print-button {
                    display: block;
                    width: 100%;
                    padding: 15px;
                    background: #D4AF37;
                    color: #0A0F1E;
                    border: none;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 20px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
                
                .print-button:hover {
                    background: #B8941F;
                }
                
                @media print {
                    body { background: white; padding: 0; }
                    .receipt-container { border: none; max-width: 100%; }
                    .print-button, .download-button { display: none; }
                    .watermark { color: rgba(212, 175, 55, 0.05); }
                }
                
                .download-button {
                    display: block;
                    width: 100%;
                    padding: 15px;
                    background: #0A0F1E;
                    color: #D4AF37;
                    border: 2px solid #D4AF37;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 10px;
                    text-transform: uppercase;
                    letter-spacing: 2px;
                }
            </style>
        </head>
        <body>
            <div class="receipt-container" id="receipt">
                <div class="watermark">PAID</div>
                
                <div class="header">
                    <div class="logo">K</div>
                    <div class="school-name">KATEVILLE INTERNATIONAL SCHOOL</div>
                    <div class="school-address">
                        Ada George Road, Rumuokwuta<br>
                        Port Harcourt, Rivers State, Nigeria<br>
                        Tel: +234 801 234 5678 | Email: info@kateville.edu.ng
                    </div>
                </div>
                
                <div class="receipt-title">OFFICIAL RECEIPT</div>
                
                <div class="receipt-details">
                    <div class="detail-row">
                        <span class="detail-label">Receipt No:</span>
                        <span class="detail-value">${paymentData.reference}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${date}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Time:</span>
                        <span class="detail-value">${time}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Student Name:</span>
                        <span class="detail-value">${paymentData.student_name}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Payment Type:</span>
                        <span class="detail-value">${this.formatPaymentType(paymentData.type)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Academic Term:</span>
                        <span class="detail-value">${paymentData.term || 'Current Term'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value"><span class="status-badge">✓ Paid</span></span>
                    </div>
                </div>
                
                <div class="amount-section">
                    <div class="amount-row">
                        <span>School Fees</span>
                        <span>₦${paymentData.school_fee?.toLocaleString() || paymentData.amount?.toLocaleString()}</span>
                    </div>
                    ${paymentData.processing_fee ? `
                    <div class="amount-row">
                        <span>Processing Fee</span>
                        <span>₦${paymentData.processing_fee.toLocaleString()}</span>
                    </div>
                    ` : ''}
                    <div class="amount-row total">
                        <span>TOTAL PAID</span>
                        <span>₦${(paymentData.visible_total || paymentData.amount).toLocaleString()}</span>
                    </div>
                </div>
                
                <div class="footer">
                    <div class="qr-code">QR</div>
                    <p>This is an official receipt from Kateville International School</p>
                    <p>Verify at: https://kateville.edu.ng/verify/${paymentData.reference}</p>
                    <p style="margin-top: 10px; font-style: italic;">"Where World Changers Are Made"</p>
                </div>
            </div>
            
            <button class="print-button" onclick="window.print()">🖨️ Print Receipt</button>
            <button class="download-button" onclick="downloadPDF()">📄 Download PDF</button>
            
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
            <script>
                function downloadPDF() {
                    const element = document.getElementById('receipt');
                    const opt = {
                        margin: 0,
                        filename: 'Kateville-Receipt-${paymentData.reference}.pdf',
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2 },
                        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
                    };
                    html2pdf().set(opt).from(element).save();
                }
            <\/script>
        </body>
        </html>
        `;
    }
    
    static formatPaymentType(type) {
        const types = {
            'tuition': 'School Fees',
            'uniform': 'Uniform',
            'exam': 'Examination Fees',
            'transport': 'Transportation',
            'others': 'Other Charges'
        };
        return types[type] || type;
    }
    
    // Open receipt in new window
    static showReceipt(paymentData) {
        const receiptWindow = window.open('', '_blank', 'width=800,height=800');
        receiptWindow.document.write(this.generateReceiptHTML(paymentData));
        receiptWindow.document.close();
    }
    
    // Generate receipt for download without opening
    static async downloadReceipt(paymentData) {
        const html = this.generateReceiptHTML(paymentData);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `Receipt-${paymentData.reference}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}
