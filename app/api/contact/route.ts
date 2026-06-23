import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { z } from "zod";
import { saveInquiry } from "@/lib/inquiries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const contactSchema = z.object({
  fullName: z.string().trim().max(120).optional().default(""),
  email: z.string().trim().email(),
  company: z.string().trim().max(160).optional().default(""),
  topic: z.string().trim().min(1).max(120),
  details: z.string().trim().min(10).max(5000),
});

function getTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("SMTP is not configured");
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE !== "false",
    auth: {
      user,
      pass,
    },
  });
}

export async function POST(request: Request) {
  try {
    const payload = contactSchema.parse(await request.json());

    // 1) Try to email it (only if SMTP is configured).
    let emailed = false;
    let emailError: unknown = null;
    try {
      const transport = getTransport();
      const to = process.env.CONTACT_TO_EMAIL || "info@thecyberadviser.com";
      const from = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || to;

      const subject = `Consultation Request - ${payload.topic}`;
      const text = [
        `Full Name: ${payload.fullName || "-"}`,
        `Corporate Email: ${payload.email}`,
        `Company: ${payload.company || "-"}`,
        `Topic: ${payload.topic}`,
        "",
        "Requirement Details:",
        payload.details,
      ].join("\n");

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h2 style="margin-bottom: 16px;">New Consultation Request</h2>
          <p><strong>Full Name:</strong> ${payload.fullName || "-"}</p>
          <p><strong>Corporate Email:</strong> ${payload.email}</p>
          <p><strong>Company:</strong> ${payload.company || "-"}</p>
          <p><strong>Topic:</strong> ${payload.topic}</p>
          <p style="margin-top: 20px;"><strong>Requirement Details:</strong></p>
          <div style="white-space: pre-wrap; border: 1px solid #e5e7eb; padding: 12px; border-radius: 8px;">${payload.details}</div>
        </div>
      `;

      await transport.sendMail({ from, to, replyTo: payload.email, subject, text, html });
      emailed = true;
    } catch (err) {
      emailError = err;
      console.error("Contact email send failed (will still persist)", err);
    }

    // 2) Always persist to the DB so an inquiry is never lost (and the admin
    //    can review submissions even before SMTP is configured).
    let saved = false;
    try {
      await saveInquiry(payload, emailed);
      saved = true;
    } catch (err) {
      console.error("Contact inquiry persist failed", err);
    }

    if (emailed || saved) {
      return NextResponse.json({ ok: true });
    }
    throw emailError || new Error("Inquiry could not be delivered or saved.");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, error: "Please complete the required fields correctly." },
        { status: 400 }
      );
    }

    console.error("Contact form send failed", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          "Unable to send your inquiry right now. Please try again shortly.",
      },
      { status: 500 }
    );
  }
}
