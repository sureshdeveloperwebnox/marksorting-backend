import { WhatsAppService } from './src/modules/whatsapp/whatsapp.service';
import { ConfigService } from '@nestjs/config';
import { PdfService } from './src/modules/pdf/pdf.service';

async function testWhatsAppPdf() {
  const configService = new ConfigService();
  const pdfService = new PdfService(configService);
  
  // Create a simple test PDF
  const testHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #333; }
        p { color: #666; }
      </style>
    </head>
    <body>
      <h1>Test WhatsApp PDF</h1>
      <p>This is a test PDF sent via WhatsApp.</p>
      <p>Test Number: 89361880749</p>
      <p>Date: ${new Date().toISOString()}</p>
    </body>
    </html>
  `;

  try {
    console.log('Generating test PDF...');
    const pdfBuffer = await pdfService.renderHtmlToPdf(testHtml);
    console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');

    // Note: We can't directly instantiate WhatsAppService without the NestJS context
    // So we'll use the Ultramsg API directly for testing
    const ULTRAMSG_API_TOKEN = process.env.ULTRAMSG_API_TOKEN || '901394c0traxmn8u';
    const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || 'instance15882';
    const ULTRAMSG_BASE_URL = process.env.ULTRAMSG_BASE_URL || 'https://api.ultramsg.com';

    // Convert buffer to base64
    const base64Data = pdfBuffer.toString('base64');
    const dataUrl = `data:application/pdf;base64,${base64Data}`;

    // Format phone number
    let phone = '+919361880749';

    console.log('Sending WhatsApp message to:', phone);
    console.log('Using Ultramsg instance:', ULTRAMSG_INSTANCE_ID);

    const formData = new URLSearchParams();
    formData.append('token', ULTRAMSG_API_TOKEN);
    formData.append('to', phone);
    formData.append('document', dataUrl);
    formData.append('filename', 'test-whatsapp-pdf.pdf');

    const response = await fetch(
      `${ULTRAMSG_BASE_URL}/${ULTRAMSG_INSTANCE_ID}/messages/document`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      }
    );

    const result = await response.json();
    console.log('Response:', result);

    if (result.sent) {
      console.log('✅ WhatsApp message sent successfully!');
      console.log('Message ID:', result.msgId);
    } else {
      console.log('❌ Failed to send WhatsApp message');
      console.log('Error:', result);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testWhatsAppPdf();
