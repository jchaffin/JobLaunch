import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json();

    if (!pdfUrl) {
      return NextResponse.json({ error: 'PDF URL is required' }, { status: 400 });
    }

    console.log('Converting PDF to image for URL:', pdfUrl);

    // Launch puppeteer to convert PDF to image
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    });

    const page = await browser.newPage();
    
    // Set viewport size
    await page.setViewport({ width: 595, height: 842 }); // A4 size
    
    // Create a simple HTML page that displays the PDF URL as iframe
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; }
            iframe { width: 100%; height: 100vh; border: none; }
          </style>
        </head>
        <body>
          <iframe src="${pdfUrl}#view=FitH" type="application/pdf"></iframe>
        </body>
      </html>
    `;

    await page.setContent(html);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    await browser.close();

    console.log('PDF converted to image successfully');

    return new NextResponse(screenshot, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('Error converting PDF to image:', error);
    
    // Return a fallback placeholder image
    const canvasLib = await import('canvas');
    const canvasInstance = canvasLib.createCanvas(595, 842);
    const ctx = canvasInstance.getContext('2d');
    
    // Draw white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 595, 842);
    
    // Draw placeholder text
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PDF Preview', 297, 400);
    ctx.fillText('Image conversion failed', 297, 430);
    
    // Draw border
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, 595, 842);
    
    const buffer = canvasInstance.toBuffer('image/png');
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/png',
      },
    });
  }
}