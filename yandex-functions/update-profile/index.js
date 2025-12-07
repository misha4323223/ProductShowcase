const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// Нормализация телефона для корректного сравнения
function normalizePhone(phone) {
  if (!phone) return null;
  // Убираем все кроме цифр
  let digits = phone.replace(/\D/g, '');
  // Приводим к формату 7XXXXXXXXXX (11 цифр)
  if (digits.length === 10) {
    digits = '7' + digits;
  } else if (digits.length === 11 && digits.startsWith('8')) {
    digits = '7' + digits.slice(1);
  }
  return digits.length === 11 ? digits : null;
}

const client = new DynamoDBClient({
  region: "ru-central1",
  endpoint: process.env.YDB_ENDPOINT,
  credentials: {
    accessKeyId: process.env.YDB_ACCESS_KEY_ID,
    secretAccessKey: process.env.YDB_SECRET_KEY,
  },
});

const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

function createResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  };
}

// Валидация даты рождения (формат YYYY-MM-DD)
function validateBirthDate(dateString) {
  if (!dateString) return { valid: true }; // Пустая дата допустима
  
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return { valid: false, error: "Неверный формат даты. Используйте ГГГГ-ММ-ДД" };
  }
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Недействительная дата" };
  }
  
  // Проверка что дата не в будущем
  if (date > new Date()) {
    return { valid: false, error: "Дата рождения не может быть в будущем" };
  }
  
  // Проверка что возраст не более 150 лет
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  if (date < minDate) {
    return { valid: false, error: "Недействительная дата рождения" };
  }
  
  return { valid: true };
}

// Валидация имени (только буквы и дефис)
function validateName(name, fieldName) {
  if (!name) return { valid: true }; // Пустое имя допустимо
  
  // Разрешаем кириллицу, латиницу, дефис и пробел
  const regex = /^[а-яёА-ЯЁa-zA-Z\s\-]+$/;
  if (!regex.test(name)) {
    return { valid: false, error: `${fieldName} может содержать только буквы, пробелы и дефисы` };
  }
  
  if (name.length > 50) {
    return { valid: false, error: `${fieldName} не может быть длиннее 50 символов` };
  }
  
  return { valid: true };
}

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { email, firstName, lastName, patronymic, birthDate, phone } = body;

    if (!email) {
      return createResponse(400, { error: "Email обязателен" });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Проверяем существование пользователя
    const getCommand = new GetCommand({
      TableName: "users",
      Key: { email: trimmedEmail }
    });

    const existingUser = await docClient.send(getCommand);

    if (!existingUser.Item) {
      return createResponse(404, { error: "Пользователь не найден" });
    }

    // Валидация данных
    const firstNameValidation = validateName(firstName, "Имя");
    if (!firstNameValidation.valid) {
      return createResponse(400, { error: firstNameValidation.error });
    }

    const lastNameValidation = validateName(lastName, "Фамилия");
    if (!lastNameValidation.valid) {
      return createResponse(400, { error: lastNameValidation.error });
    }

    const patronymicValidation = validateName(patronymic, "Отчество");
    if (!patronymicValidation.valid) {
      return createResponse(400, { error: patronymicValidation.error });
    }

    const birthDateValidation = validateBirthDate(birthDate);
    if (!birthDateValidation.valid) {
      return createResponse(400, { error: birthDateValidation.error });
    }

    // Формируем список обновляемых полей
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    // Обновляем только те поля, которые были переданы
    if (firstName !== undefined) {
      updateExpressions.push("#firstName = :firstName");
      expressionAttributeNames["#firstName"] = "firstName";
      expressionAttributeValues[":firstName"] = firstName.trim();
    }

    if (lastName !== undefined) {
      updateExpressions.push("#lastName = :lastName");
      expressionAttributeNames["#lastName"] = "lastName";
      expressionAttributeValues[":lastName"] = lastName.trim();
    }

    if (patronymic !== undefined) {
      updateExpressions.push("#patronymic = :patronymic");
      expressionAttributeNames["#patronymic"] = "patronymic";
      expressionAttributeValues[":patronymic"] = patronymic.trim();
    }

    if (birthDate !== undefined) {
      updateExpressions.push("#birthDate = :birthDate");
      expressionAttributeNames["#birthDate"] = "birthDate";
      expressionAttributeValues[":birthDate"] = birthDate;
    }

    if (phone !== undefined) {
      const trimmedPhone = phone.trim();
      const normalizedInputPhone = normalizePhone(trimmedPhone);
      
      updateExpressions.push("#phone = :phone");
      expressionAttributeNames["#phone"] = "phone";
      expressionAttributeValues[":phone"] = trimmedPhone;
      
      // Сохраняем нормализованный телефон
      if (normalizedInputPhone) {
        updateExpressions.push("#normalizedPhone = :normalizedPhone");
        expressionAttributeNames["#normalizedPhone"] = "normalizedPhone";
        expressionAttributeValues[":normalizedPhone"] = normalizedInputPhone;
        
        // Ищем Яндекс аккаунт с таким же телефоном для синхронизации
        if (!existingUser.Item.yandexId) {
          console.log('🔍 Поиск Яндекс аккаунта с телефоном:', normalizedInputPhone);
          
          const scanYandexUsers = new ScanCommand({
            TableName: "users",
            FilterExpression: "attribute_exists(yandexPhone) AND yandexPhone <> :empty",
            ExpressionAttributeValues: { ":empty": "" },
          });
          
          const yandexUsersResult = await docClient.send(scanYandexUsers);
          
          if (yandexUsersResult.Items && yandexUsersResult.Items.length > 0) {
            const matchingYandexUser = yandexUsersResult.Items.find(user => {
              const yandexNormalizedPhone = normalizePhone(user.yandexPhone);
              return yandexNormalizedPhone && yandexNormalizedPhone === normalizedInputPhone && user.email !== trimmedEmail;
            });
            
            if (matchingYandexUser) {
              console.log('✅ Найден Яндекс аккаунт для привязки:', matchingYandexUser.email);
              
              // Копируем данные из Яндекс аккаунта
              updateExpressions.push("#yandexId = :yandexId");
              expressionAttributeNames["#yandexId"] = "yandexId";
              expressionAttributeValues[":yandexId"] = matchingYandexUser.yandexId;
              
              if (matchingYandexUser.yandexEmail) {
                updateExpressions.push("#yandexEmail = :yandexEmail");
                expressionAttributeNames["#yandexEmail"] = "yandexEmail";
                expressionAttributeValues[":yandexEmail"] = matchingYandexUser.yandexEmail;
              }
              
              if (matchingYandexUser.yandexFirstName) {
                updateExpressions.push("#yandexFirstName = :yandexFirstName");
                expressionAttributeNames["#yandexFirstName"] = "yandexFirstName";
                expressionAttributeValues[":yandexFirstName"] = matchingYandexUser.yandexFirstName;
              }
              
              if (matchingYandexUser.yandexLastName) {
                updateExpressions.push("#yandexLastName = :yandexLastName");
                expressionAttributeNames["#yandexLastName"] = "yandexLastName";
                expressionAttributeValues[":yandexLastName"] = matchingYandexUser.yandexLastName;
              }
              
              if (matchingYandexUser.yandexPhone) {
                updateExpressions.push("#yandexPhone = :yandexPhone");
                expressionAttributeNames["#yandexPhone"] = "yandexPhone";
                expressionAttributeValues[":yandexPhone"] = matchingYandexUser.yandexPhone;
              }
              
              updateExpressions.push("#yandexLinkedAt = :yandexLinkedAt");
              expressionAttributeNames["#yandexLinkedAt"] = "yandexLinkedAt";
              expressionAttributeValues[":yandexLinkedAt"] = new Date().toISOString();
            }
          }
        }
      }
    }

    // Добавляем дату обновления
    updateExpressions.push("#updatedAt = :updatedAt");
    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    if (updateExpressions.length === 1) {
      // Только updatedAt, нечего обновлять
      return createResponse(400, { error: "Нет данных для обновления" });
    }

    // Обновляем профиль
    const updateCommand = new UpdateCommand({
      TableName: "users",
      Key: { email: trimmedEmail },
      UpdateExpression: "SET " + updateExpressions.join(", "),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW"
    });

    const result = await docClient.send(updateCommand);
    const updatedUser = result.Attributes;

    console.log(`✅ Profile updated for: ${trimmedEmail}`);

    // Возвращаем обновленный профиль с данными Яндекса
    const profile = {
      email: updatedUser.email,
      userId: updatedUser.userId,
      firstName: updatedUser.firstName || "",
      lastName: updatedUser.lastName || "",
      patronymic: updatedUser.patronymic || "",
      birthDate: updatedUser.birthDate || "",
      phone: updatedUser.phone || "",
      normalizedPhone: updatedUser.normalizedPhone || "",
      role: updatedUser.role || "user",
      // Данные от Яндекс
      yandexId: updatedUser.yandexId || null,
      yandexEmail: updatedUser.yandexEmail || null,
      yandexFirstName: updatedUser.yandexFirstName || null,
      yandexLastName: updatedUser.yandexLastName || null,
      yandexPhone: updatedUser.yandexPhone || null,
      yandexLinkedAt: updatedUser.yandexLinkedAt || null,
    };

    return createResponse(200, {
      success: true,
      message: "Профиль успешно обновлен",
      profile
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    return createResponse(500, { error: "Ошибка при обновлении профиля" });
  }
};
