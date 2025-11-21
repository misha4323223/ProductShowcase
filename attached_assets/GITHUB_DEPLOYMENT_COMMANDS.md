# 🚀 Деплой Sweet Delights на GitHub

## Шаг 1️⃣: Проверить статус Git
```bash
git status
```

## Шаг 2️⃣: Добавить все файлы
```bash
git add .
```

## Шаг 3️⃣: Создать коммит
```bash
git commit -m "Deploy: Add email verification, password reset, and complete auth system"
```

## Шаг 4️⃣: Создать репозиторий на GitHub

1. Откройте https://github.com/new
2. Назовите репозиторий: **sweet-delights** (или как вам нравится)
3. Выберите: **Public** (чтобы все видели) или **Private** (только вы)
4. НЕ инициализируйте с README (у вас уже есть репо)
5. Нажмите **Create repository**

## Шаг 5️⃣: Добавить удалённый репозиторий

Замените `YOUR_USERNAME` на ваше имя пользователя GitHub:

```bash
git remote add origin https://github.com/YOUR_USERNAME/sweet-delights.git
```

**Пример:**
```bash
git remote add origin https://github.com/john-doe/sweet-delights.git
```

## Шаг 6️⃣: Переименовать ветку (если нужно)

```bash
git branch -M main
```

## Шаг 7️⃣: Запушить на GitHub

```bash
git push -u origin main
```

---

## 📝 Все команды вместе (копипастой):

```bash
git add .
git commit -m "Deploy: Add email verification, password reset, and complete auth system"
git remote add origin https://github.com/YOUR_USERNAME/sweet-delights.git
git branch -M main
git push -u origin main
```

---

## ⚠️ Важно:

- Замените `YOUR_USERNAME` на ваше имя пользователя GitHub
- Если появится ошибка про SSH ключ, используйте HTTPS URL вместо SSH
- Если вы уже добавляли origin, сначала удалите его: `git remote remove origin`

---

## 🔑 Если нужен SSH (продвинутый уровень):

1. Сгенерируйте SSH ключ (если его нет): https://docs.github.com/en/authentication/connecting-to-github-with-ssh
2. Используйте SSH URL вместо HTTPS:
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/sweet-delights.git
   ```

---

**Готово! Ваш проект будет доступен на GitHub** ✨
