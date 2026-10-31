"use client";

// Fictional sample images drawn on a canvas, so judges and new users can try the
// OCR → AI flows instantly without uploading anything real. All names, numbers and
// banks are invented and every image is stamped "SAMPLE".

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  return { c, ctx };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      y += lh;
      line = w;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

function stamp(ctx: CanvasRenderingContext2D, w: number) {
  ctx.save();
  ctx.fillStyle = "#c52f3a";
  ctx.font = "bold 22px Arial";
  ctx.fillText("SAMPLE · FICTIONAL", w - 270, 34);
  ctx.restore();
}

export const SAMPLE_SMS_TEXT =
  "Dear Customer, your Sitara Bank account will be BLOCKED within 2 hours due to incomplete KYC. To keep it active reply with the 6-digit OTP sent to your phone or update at http://sitara-bank-kyc.xyz/verify. Call our helpline 0301-4455821 urgently.";

export function sampleScamSms(): string {
  const W = 900, H = 900;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = "#f2f2f7";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, 120);
  ctx.fillStyle = "#111";
  ctx.font = "bold 34px Arial";
  ctx.fillText("+92 301 4455821", 60, 72);
  ctx.font = "24px Arial";
  ctx.fillStyle = "#666";
  ctx.fillText("Text Message · Today 9:41 AM", 60, 106);
  stamp(ctx, W);
  // bubble
  ctx.fillStyle = "#e5e5ea";
  ctx.beginPath();
  ctx.roundRect(50, 170, 790, 470, 34);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.font = "32px Arial";
  wrap(ctx, SAMPLE_SMS_TEXT, 85, 230, 720, 46);
  ctx.fillStyle = "#8e8e93";
  ctx.font = "22px Arial";
  ctx.fillText("Delivered", 60, 680);
  return c.toDataURL("image/png");
}

export function samplePortal(): string {
  const W = 1000, H = 860;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#0b4a8f";
  ctx.fillRect(0, 0, W, 110);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 38px Arial";
  ctx.fillText("Roshni Power Company", 40, 70);
  stamp(ctx, W);
  ctx.fillStyle = "#111";
  ctx.font = "bold 40px Arial";
  ctx.fillText("Pay Your Electricity Bill", 40, 190);
  ctx.font = "28px Arial";
  ctx.fillStyle = "#333";
  ctx.fillText("Reference Number", 40, 270);
  ctx.strokeStyle = "#c52f3a";
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 290, 620, 70);
  ctx.fillStyle = "#555";
  ctx.font = "30px Arial";
  ctx.fillText("0412 3456 7890", 60, 337);
  ctx.fillStyle = "#c52f3a";
  ctx.font = "26px Arial";
  ctx.fillText("Error: Invalid reference number. Enter all 14 digits.", 40, 400);
  ctx.fillStyle = "#333";
  ctx.font = "28px Arial";
  ctx.fillText("Mobile Number (optional)", 40, 480);
  ctx.strokeStyle = "#999";
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 500, 620, 70);
  // buttons
  ctx.fillStyle = "#c9efe9";
  ctx.beginPath();
  ctx.roundRect(40, 620, 260, 80, 14);
  ctx.fill();
  ctx.fillStyle = "#04332e";
  ctx.font = "bold 32px Arial";
  ctx.fillText("Continue", 100, 672);
  ctx.strokeStyle = "#0b8577";
  ctx.beginPath();
  ctx.roundRect(330, 620, 220, 80, 14);
  ctx.stroke();
  ctx.fillStyle = "#0b8577";
  ctx.fillText("Cancel", 390, 672);
  ctx.fillStyle = "#0b4a8f";
  ctx.font = "26px Arial";
  ctx.fillText("Forgot reference number? Click here", 40, 780);
  return c.toDataURL("image/png");
}

export function sampleBill(): string {
  const W = 1000, H = 1100;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = "#fffdf7";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#16324f";
  ctx.fillRect(0, 0, W, 120);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 40px Arial";
  ctx.fillText("ROSHNI POWER COMPANY", 40, 75);
  stamp(ctx, W);
  ctx.fillStyle = "#111";
  ctx.font = "bold 34px Arial";
  ctx.fillText("ELECTRICITY BILL - OCT 2026", 40, 190);
  const rows: [string, string][] = [
    ["Consumer Name", "Abdul Rauf"],
    ["Reference No", "04 12345 6789012"],
    ["Meter No", "88213"],
    ["Bill Date", "01-10-2026"],
    ["Due Date", "18-10-2026"],
    ["Units Consumed", "245 kWh"],
    ["Energy Charges", "Rs 3,910"],
    ["FPA (Fuel Price Adjustment)", "Rs 420"],
    ["GST / Taxes", "Rs 530"],
    ["Arrears", "Rs 0"],
  ];
  ctx.font = "30px Arial";
  let y = 260;
  for (const [k, v] of rows) {
    ctx.fillStyle = "#444";
    ctx.fillText(k, 40, y);
    ctx.fillStyle = "#111";
    ctx.font = "bold 30px Arial";
    ctx.fillText(v, 560, y);
    ctx.font = "30px Arial";
    ctx.strokeStyle = "#e5e1d6";
    ctx.beginPath();
    ctx.moveTo(40, y + 18);
    ctx.lineTo(W - 40, y + 18);
    ctx.stroke();
    y += 62;
  }
  ctx.fillStyle = "#e8f6f3";
  ctx.fillRect(40, y + 10, W - 80, 170);
  ctx.fillStyle = "#0b4a47";
  ctx.font = "bold 34px Arial";
  ctx.fillText("Payable within due date: Rs 4,860", 70, y + 75);
  ctx.fillStyle = "#9a3b00";
  ctx.font = "30px Arial";
  ctx.fillText("Payable after due date (late payment surcharge): Rs 5,346", 70, y + 135);
  ctx.fillStyle = "#555";
  ctx.font = "24px Arial";
  ctx.fillText("Pay at any bank branch or through your bank's official app.", 40, y + 240);
  return c.toDataURL("image/png");
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, b64] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(head)?.[1] ?? "image/png";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
