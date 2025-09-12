import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { Letter, Address } from '@shared/schema';

// Ensure PDF directory exists
const PDF_DIR = path.join(process.cwd(), 'generated-pdfs');
if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

export class PDFService {
  private static formatAddress(address: Address): string {
    return `${address.street}<br>
            ${address.city}, ${address.state} ${address.zip}<br>
            ${address.country}`;
  }

  private static formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private static generateLetterHTML(letter: Letter): string {
    const senderAddress = letter.senderAddress as Address;
    const recipientAddress = letter.recipientAddress as Address;
    const currentDate = letter.completedAt ? new Date(letter.completedAt) : new Date();

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Legal Letter - ${letter.subject}</title>
        <style>
            @page {
                margin: 1in;
                size: letter;
            }
            
            body {
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                line-height: 1.6;
                color: #000;
                margin: 0;
                padding: 0;
            }
            
            .letterhead {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            
            .firm-name {
                font-size: 18pt;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
            }
            
            .attorney-info {
                font-size: 11pt;
                color: #555;
            }
            
            .date-section {
                text-align: right;
                margin-bottom: 30px;
                font-size: 11pt;
            }
            
            .addresses {
                margin-bottom: 30px;
            }
            
            .sender-address {
                margin-bottom: 25px;
            }
            
            .recipient-address {
                margin-bottom: 25px;
            }
            
            .address-label {
                font-weight: bold;
                margin-bottom: 5px;
                font-size: 10pt;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .address-content {
                font-size: 11pt;
                line-height: 1.4;
            }
            
            .subject-line {
                font-weight: bold;
                margin: 30px 0;
                text-decoration: underline;
                font-size: 12pt;
            }
            
            .letter-body {
                margin-bottom: 40px;
                text-align: justify;
                line-height: 1.8;
            }
            
            .letter-body p {
                margin-bottom: 15px;
                text-indent: 0;
            }
            
            .signature-section {
                margin-top: 50px;
            }
            
            .closing {
                margin-bottom: 60px;
            }
            
            .signature-line {
                border-bottom: 1px solid #333;
                width: 250px;
                margin-bottom: 5px;
            }
            
            .signature-name {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .signature-title {
                font-size: 10pt;
                color: #666;
            }
            
            .footer {
                position: fixed;
                bottom: 0.5in;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 9pt;
                color: #888;
                border-top: 1px solid #ddd;
                padding-top: 10px;
            }
            
            .page-break {
                page-break-before: always;
            }
        </style>
    </head>
    <body>
        <div class="letterhead">
            <div class="firm-name">
                ${letter.senderFirmName || 'LEGAL SERVICES'}
            </div>
            <div class="attorney-info">
                Professional Legal Correspondence
            </div>
        </div>

        <div class="date-section">
            ${this.formatDate(currentDate)}
        </div>

        <div class="addresses">
            <div class="sender-address">
                <div class="address-label">From:</div>
                <div class="address-content">
                    <strong>${letter.senderName}</strong><br>
                    ${this.formatAddress(senderAddress)}
                </div>
            </div>

            <div class="recipient-address">
                <div class="address-label">To:</div>
                <div class="address-content">
                    <strong>${letter.recipientName}</strong><br>
                    ${this.formatAddress(recipientAddress)}
                </div>
            </div>
        </div>

        <div class="subject-line">
            RE: ${letter.subject}
        </div>

        <div class="letter-body">
            ${this.formatLetterContent(letter.finalContent || letter.aiGeneratedContent || '')}
        </div>

        <div class="signature-section">
            <div class="closing">
                Sincerely,
            </div>
            
            <div class="signature-line"></div>
            <div class="signature-name">${letter.senderName}</div>
            ${letter.senderFirmName ? `<div class="signature-title">${letter.senderFirmName}</div>` : ''}
        </div>

        <div class="footer">
            This letter was generated on ${this.formatDate(currentDate)} | Document ID: ${letter.id}
        </div>
    </body>
    </html>
    `;
  }

  private static formatLetterContent(content: string): string {
    // Clean and format the letter content
    if (!content) return '<p>No content available.</p>';
    
    // Split content into paragraphs and wrap each in <p> tags
    const paragraphs = content
      .split('\n\n')
      .filter(p => p.trim().length > 0)
      .map(p => p.trim().replace(/\n/g, ' '))
      .map(p => `<p>${p}</p>`);
    
    return paragraphs.length > 0 ? paragraphs.join('\n') : `<p>${content}</p>`;
  }

  static async generatePDF(letter: Letter): Promise<string> {
    let browser;
    
    try {
      // Launch browser with specific configurations
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();
      
      // Set page size and margins
      await page.setViewport({ width: 1200, height: 1600 });
      
      // Generate the HTML content
      const htmlContent = this.generateLetterHTML(letter);
      
      // Set the HTML content
      await page.setContent(htmlContent, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Generate filename with timestamp and letter ID
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `letter-${letter.id}-${timestamp}.pdf`;
      const filePath = path.join(PDF_DIR, filename);

      // Generate PDF
      await page.pdf({
        path: filePath,
        format: 'letter',
        margin: {
          top: '1in',
          right: '1in',
          bottom: '1in',
          left: '1in'
        },
        printBackground: true,
        preferCSSPageSize: true
      });

      console.log(`PDF generated successfully: ${filePath}`);
      
      // Return relative path that can be served by the web server
      return `/api/pdfs/${filename}`;
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  static async getPDFPath(filename: string): Promise<string> {
    const filePath = path.join(PDF_DIR, filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('PDF file not found');
    }
    
    return filePath;
  }

  static listPDFs(): string[] {
    try {
      return fs.readdirSync(PDF_DIR).filter(file => file.endsWith('.pdf'));
    } catch (error) {
      console.error('Error listing PDFs:', error);
      return [];
    }
  }

  static deletePDF(filename: string): boolean {
    try {
      const filePath = path.join(PDF_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting PDF:', error);
      return false;
    }
  }
}