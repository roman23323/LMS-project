const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3001;

// Настройка multer для хранения загружаемых файлов в памяти
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.use(express.json());

// Эндпоинт для размещения файла
app.post('/api/store', upload.single('file'), (req, res) => {
    const userName = req.body.userName; // Получаем имя пользователя
    const file = req.file; // Получаем файл

    if (!file) {
        return res.status(400).json({ message: 'Файл не был загружен' });
    }

    // Определяем путь для сохранения файла
    const userDir = path.join(__dirname, 'uploads', userName);
    
    // Создаем подкаталог, если он не существует
    fs.mkdir(userDir, { recursive: true }, (err) => {
        if (err) {
            console.error('Ошибка при создании каталога:', err);
            return res.status(500).json({ message: 'Ошибка при создании каталога' });
        }

        // Путь для сохранения файла
        const filePath = path.join(userDir, file.originalname);

        // Сохраняем файл на диск
        fs.writeFile(filePath, file.buffer, (err) => {
            if (err) {
                console.error('Ошибка при сохранении файла:', err);
                return res.status(500).json({ message: 'Ошибка при сохранении файла' });
            }

            res.json({ message: 'Файл успешно сохранен!', filePath });
        });
    });
});

app.post('/api/download', async (req, res) => {
    console.log("Дошло до хранилища: " + req.body);
    const { userName, fileName } = req.body; // Получаем имя пользователя
    console.log(fileName, fileName, "путь:", path.join(__dirname, userName, fileName));
    const filePath = path.join(__dirname, "uploads", userName, fileName); // Формируем путь к файлу

    try {
        // Попытаемся отправить файл
        await res.download(filePath, (err) => {
            if (err) {
                console.error('Ошибка при скачивании файла:', err);
                res.status(500).send('Ошибка при скачивании файла.');
            }
        });
    } catch (error) {
        console.error('Ошибка при отправке файла:', error);
        res.status(500).json({ error: 'Ошибка при отправке файла' });
    }
});

// Обработка запроса на проверку наличия файла
app.post('/api/askForFile', async (req, res) => {
    console.log("Запрос на проверку файла");
    const { fileName, userName } = req.body; // Извлекаем имя файла и имя пользователя
    const filePath = path.join(__dirname, "uploads", userName, fileName); // Формируем путь к файлу

    try {
        // Проверяем, существует ли файл
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                console.error('Файл не найден:', filePath);
                return res.status(200).send('false'); // Возвращаем 'false', если файл не найден
            }

            console.log('Файл найден:', filePath);
            return res.status(200).send('true'); // Возвращаем 'true', если файл найден
        });
    } catch (error) {
        console.error('Ошибка при проверке файла:', error);
        res.status(500).send('false'); // Возвращаем 'false' в случае исключения
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Контейнер-хранилище запущен на http://localhost:${PORT}`);
});