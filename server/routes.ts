import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/send-stock-notifications", async (req, res) => {
    try {
      const { productId, productName, productUrl } = req.body;
      
      if (!productId || !productName || !productUrl) {
        return res.status(400).json({ 
          error: "Missing required fields: productId, productName, productUrl" 
        });
      }
      
      const apiKey = process.env.RESEND_API_KEY;
      
      if (!apiKey) {
        console.error("RESEND_API_KEY не найден в переменных окружения");
        return res.status(500).json({ error: "Email service not configured" });
      }
      
      const { emails } = req.body;
      
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.json({ sentCount: 0 });
      }
      
      let sentCount = 0;
      
      for (const email of emails) {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              from: "Sweet Delights <onboarding@resend.dev>",
              to: [email],
              subject: `${productName} снова в наличии! 🎉`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #EC4899;">Отличные новости!</h2>
                  <p style="font-size: 16px; line-height: 1.5;">
                    Товар <strong>${productName}</strong>, на который вы подписались, снова в наличии!
                  </p>
                  <p style="font-size: 16px; line-height: 1.5;">
                    Поспешите оформить заказ, пока товар не закончился снова.
                  </p>
                  <a href="${productUrl}" style="display: inline-block; background-color: #EC4899; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">
                    Перейти к товару
                  </a>
                  <p style="font-size: 14px; color: #666; margin-top: 30px;">
                    С наилучшими пожеланиями,<br/>
                    Команда Sweet Delights 🍬
                  </p>
                </div>
              `,
            }),
          });
          
          if (response.ok) {
            sentCount++;
          } else {
            console.error(`Ошибка отправки письма на ${email}:`, await response.text());
          }
        } catch (error) {
          console.error(`Ошибка отправки письма на ${email}:`, error);
        }
      }
      
      res.json({ sentCount });
    } catch (error: any) {
      console.error("Ошибка отправки уведомлений:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
