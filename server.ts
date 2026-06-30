import express from "express";
import path from "path";
import cors from "cors";
import cron from "node-cron";
import { createServer as createViteServer } from "vite";
import { getGlobalAppState, updateGlobalAppState, getAllSuppliers, replaceAllSuppliers, getAllOrders, replaceAllOrders } from "./src/db/queries.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/stock", async (req, res) => {
    try {
      const state = await getGlobalAppState();
      const suppliers = await getAllSuppliers();
      const orders = await getAllOrders();
      res.json({
        currentStock: state.currentStock,
        lowStockThreshold: state.lowStockThreshold,
        dailyRequirement: state.dailyRequirement,
        fonnteToken: state.fonnteToken,
        appsScriptUrl: state.appsScriptUrl,
        isAutoOrderEnabled: state.isAutoOrderEnabled,
        lastSupplierIndex: state.lastSupplierIndex,
        suppliers: suppliers.map(s => ({...s, pricePerKg: Number(s.pricePerKg), capacity: Number(s.capacity)})),
        orders: orders.map(o => ({...o, quantity: Number(o.quantity)}))
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/stock", async (req, res) => {
    try {
      if (typeof req.body.currentStock === 'number' && typeof req.body.lowStockThreshold === 'number') {
        const payload = req.body;
        await updateGlobalAppState({
          currentStock: payload.currentStock,
          lowStockThreshold: payload.lowStockThreshold,
          dailyRequirement: payload.dailyRequirement || 100,
          fonnteToken: payload.fonnteToken,
          lastSupplierIndex: typeof payload.lastSupplierIndex === 'number' ? payload.lastSupplierIndex : -1,
        });

        if (payload.suppliers) {
          await replaceAllSuppliers(payload.suppliers.map((s: any) => ({
            id: s.id,
            name: s.name,
            phone: s.phone,
            capacity: s.capacity,
            pricePerKg: s.pricePerKg
          })));
        }

        if (payload.orders) {
          await replaceAllOrders(payload.orders.map((o: any) => ({
            id: o.id,
            supplierId: o.supplierId,
            date: o.date,
            quantity: o.quantity,
            status: o.status
          })));
        }
        res.json({ success: true });
      } else {
        res.status(400).json({ error: "Invalid data format" });
      }
    } catch(e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/test-wa", async (req, res) => {
    try {
      const state = await getGlobalAppState();
      const token = state.fonnteToken || process.env.FONNTE_TOKEN;
      if (!token) {
        return res.status(400).json({ error: "Token Fonnte belum diset" });
      }
      const params = new URLSearchParams();
      params.append("target", "6281395037157");
      params.append("message", "*TES NOTIFIKASI SISTEM*\n\nJika Anda menerima pesan ini, berarti integrasi Fonnte Bot WhatsApp dengan Aplikasi Stok Putih Telur Anda telah BERHASIL.\n\nSistem akan otomatis mengirim rekap setiap jam 08:00 WIB.");

      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": token
        },
        body: params
      });
      const result = await response.json();
      res.json({ success: true, result });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Fungsi untuk mengirim report WA
  const sendDailyReport = async () => {
    console.log("⏰ Menjalankan pengecekan stok harian...");
    
    const state = await getGlobalAppState();
    const suppliers = await getAllSuppliers();
    const orders = await getAllOrders();
    
    const { currentStock, lowStockThreshold, dailyRequirement, fonnteToken: stateToken, lastSupplierIndex } = state;
    const adminPhone = "6281395037157";
    const fonnteToken = stateToken || process.env.FONNTE_TOKEN;

    if (!fonnteToken) {
      console.log("❌ FONNTE_TOKEN belum diset di Menu Settings (Secrets) atau UI. Tidak bisa mengirim WA otomatis.");
      return { success: false, error: "Token belum diset" };
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' });
    const timeStr = today.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
    
    const pendingOrOrderedQuantity = (orders || [])
      .filter((o: any) => o.status !== 'received')
      .reduce((sum: number, o: any) => sum + (o.quantity || 0), 0);

    const needToOrder = Math.max(0, (dailyRequirement || 100) - currentStock - pendingOrOrderedQuantity);

    let message = `*Update Stok Putih Telur*\n`;
    message += `Tanggal: ${dateStr}\n`;
    message += `Waktu: ${timeStr} WIB\n\n`;
    message += `Stok: *${currentStock} kg*\n`;
    message += `Kebutuhan Harian: *${dailyRequirement || 100} kg*\n`;
    message += `Batas Aman: *${lowStockThreshold} kg*\n\n`;
    
    if (needToOrder > 0) {
      message += `*KRITIS*: Perlu tambahan stok *${needToOrder} kg* hari ini.\n\n`;
      
      let nextSupplier = null;
      if (suppliers && suppliers.length > 0) {
        const nextIndex = (lastSupplierIndex + 1) % suppliers.length;
        nextSupplier = suppliers[nextIndex];
        
        await updateGlobalAppState({ lastSupplierIndex: nextIndex });
        
        message += `*Tugas Order Hari Ini (Otomatis):*\n`;
        message += `Supplier / PIC: ${nextSupplier.name}\n`;
        message += `Kontak: ${nextSupplier.phone}\n\n`;
      } else {
        message += `*(Belum ada data supplier untuk dirotasi)*`;
      }
    } else {
      message += `*AMAN*: Stok mencukupi.`;
    }
    
    try {
      // 1. Send Report to Admin
      const paramsAdmin = new URLSearchParams();
      paramsAdmin.append("target", adminPhone);
      paramsAdmin.append("message", message);

      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": fonnteToken
        },
        body: paramsAdmin
      });
      
      const result = await response.json();
      console.log("✅ API Fonnte Response (Admin):", result);
      
      // 2. If need to order and we have a supplier, send an order request to them
      if (needToOrder > 0 && suppliers && suppliers.length > 0) {
        const nextSupplier = suppliers[state.lastSupplierIndex];
        if (nextSupplier && nextSupplier.phone) {
          let supplierPhone = nextSupplier.phone.replace(/^0/, '62');
          
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = tomorrow.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Jakarta' });
          
          let orderMessage = `Halo Bos ${nextSupplier.name}, kami ingin order putih telur sebanyak ${needToOrder} kg untuk besok tanggal ${tomorrowStr}. Mohon konfirmasi ketersediaannya. Terima kasih.`;
          
          const paramsSupplier = new URLSearchParams();
          paramsSupplier.append("target", supplierPhone);
          paramsSupplier.append("message", orderMessage);

          const responseSupplier = await fetch("https://api.fonnte.com/send", {
            method: "POST",
            headers: {
              "Authorization": fonnteToken
            },
            body: paramsSupplier
          });
          console.log("✅ API Fonnte Response (Supplier):", await responseSupplier.json());
        }
      }
      
      return { success: true, result };
    } catch (error: any) {
      console.error("❌ Gagal mengirim pesan via Fonnte:", error);
      return { success: false, error: error.message };
    }
  };

  // Endpoint untuk ping agar server tetap 'terbangun' (Keep Alive)
  app.get("/api/ping", (req, res) => {
    res.json({ status: "alive", time: new Date().toISOString() });
  });

  // Endpoint khusus untuk memicu laporan dari layanan eksternal (cron-job.org / Google Cloud Scheduler)
  app.get("/api/cron/daily-report", async (req, res) => {
    const result = await sendDailyReport();
    res.json(result);
  });

  // Cron Job Internal: Run every day at 08:00 AM WIB (Waktu Indonesia Barat)
  // Catatan: Ini hanya berjalan jika server sedang TIDAK tertidur.
  cron.schedule("0 8 * * *", async () => {
    await sendDailyReport();
  }, {
    timezone: "Asia/Jakarta"
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log("Cron jobs scheduled: Daily at 08:00 WIB");
  });
}

startServer();
