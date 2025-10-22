const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.sendStockNotifications = functions
  .region('us-central1')
  .https.onCall(async (data, context) => {
    // Проверка авторизации
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'Требуется авторизация'
      );
    }

    // Проверка прав админа
    const adminEmail = 'pimashin2015@gmail.com';
    if (context.auth.token.email?.toLowerCase() !== adminEmail) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Требуются права администратора'
      );
    }

    const { productId, productName, productUrl } = data;

    if (!productId || !productName || !productUrl) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Отсутствуют обязательные поля: productId, productName, productUrl'
      );
    }

    try {
      // Получаем все подписки на этот товар
      const notificationsRef = admin
        .firestore()
        .collection('stockNotifications');
      
      const snapshot = await notificationsRef
        .where('productId', '==', productId)
        .where('notified', '==', false)
        .get();

      if (snapshot.empty) {
        return { sentCount: 0 };
      }

      const emails = snapshot.docs.map(doc => doc.data().email);
      const resendApiKey = functions.config().resend?.api_key;

      if (!resendApiKey) {
        console.error('RESEND_API_KEY не настроен в Firebase Config');
        throw new functions.https.HttpsError(
          'internal',
          'Email сервис не настроен'
        );
      }

      let sentCount = 0;

      // Отправляем email через Resend API
      for (const email of emails) {
        try {
          const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'Sweet Delights <onboarding@resend.dev>',
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
            console.error(`Ошибка отправки на ${email}:`, await response.text());
          }
        } catch (error) {
          console.error(`Ошибка отправки на ${email}:`, error);
        }
      }

      // Удаляем обработанные подписки
      const batch = admin.firestore().batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      console.log(`Отправлено ${sentCount} уведомлений для товара ${productName}`);
      return { sentCount };

    } catch (error) {
      console.error('Ошибка отправки уведомлений:', error);
      throw new functions.https.HttpsError('internal', error.message);
    }
  });
