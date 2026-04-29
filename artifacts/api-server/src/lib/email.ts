import nodemailer from "nodemailer";
import { db, configuracionTable } from "@workspace/db";
import { logger } from "./logger";

async function getConfigMap(): Promise<Record<string, string>> {
  const rows = await db.select().from(configuracionTable);
  const map: Record<string, string> = {};
  for (const r of rows) map[r.clave] = r.valor ?? "";
  return map;
}

function fmtCurrency(n: number) {
  return "₡" + n.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function sendPedidoNotification(pedido: {
  id: number;
  localNombre: string | null;
  observaciones: string | null;
  total: number;
  detalles: Array<{ productoNombre: string | null; cantidad: number; precioUnitario: number; subtotal: number }>;
}) {
  try {
    const cfg = await getConfigMap();

    const emails = (cfg["notif_emails"] ?? "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);
    if (!emails.length) return;

    const host = process.env.SMTP_HOST || cfg["smtp_host"];
    const user = process.env.SMTP_USER || cfg["smtp_user"];
    const pass = process.env.SMTP_PASS || cfg["smtp_pass"];
    const from = process.env.SMTP_FROM || cfg["smtp_from"] || user;
    const port = parseInt(process.env.SMTP_PORT || cfg["smtp_port"] || "587", 10);

    if (!host || !user || !pass) {
      logger.warn("SMTP no configurado, omitiendo notificación de pedido");
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    const lineas = pedido.detalles
      .map(
        (d) =>
          `<tr>
            <td style="padding:4px 8px;border-bottom:1px solid #eee">${d.productoNombre ?? ""}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:center">${d.cantidad}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${fmtCurrency(d.precioUnitario)}</td>
            <td style="padding:4px 8px;border-bottom:1px solid #eee;text-align:right">${fmtCurrency(d.subtotal)}</td>
          </tr>`,
      )
      .join("");

    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="background:#1e293b;color:#fff;padding:16px 24px;margin:0;border-radius:8px 8px 0 0">
          Nuevo pedido #${pedido.id}
        </h2>
        <div style="padding:16px 24px;background:#f8fafc;border-radius:0 0 8px 8px">
          <p><strong>Local:</strong> ${pedido.localNombre ?? "-"}</p>
          ${pedido.observaciones ? `<p><strong>Observaciones:</strong> ${pedido.observaciones}</p>` : ""}
          <table style="width:100%;border-collapse:collapse;margin-top:12px">
            <thead>
              <tr style="background:#e2e8f0">
                <th style="padding:6px 8px;text-align:left">Producto</th>
                <th style="padding:6px 8px;text-align:center">Cant.</th>
                <th style="padding:6px 8px;text-align:right">Precio</th>
                <th style="padding:6px 8px;text-align:right">Subtotal</th>
              </tr>
            </thead>
            <tbody>${lineas}</tbody>
          </table>
          <p style="text-align:right;font-size:1.1em;margin-top:12px">
            <strong>Total: ${fmtCurrency(pedido.total)}</strong>
          </p>
        </div>
      </div>`;

    await transporter.sendMail({
      from,
      to: emails.join(", "),
      subject: `Nuevo pedido #${pedido.id} — ${pedido.localNombre ?? "sin local"}`,
      html,
    });

    logger.info({ pedidoId: pedido.id, to: emails }, "Notificación de pedido enviada");
  } catch (err) {
    logger.error({ err }, "Error enviando notificación de pedido");
  }
}
