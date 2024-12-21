const express = require('express');
const mysql = require('mysql2/promise'); // Используем mysql2 для работы с MySQL
const multer = require('multer');
const FormData = require('form-data');
const axios = require('axios');

const app = express();
const port = 3000;

// Настройка подключения к базе данных
const pool = mysql.createPool({
  host: 'db',
  user: 'admin',
  database: 'lms_db',
  password: 'qwerty',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware для обработки JSON
app.use(express.json());

// Регистрация
app.post('/api/register', async (req, res) => {
  const { name, login, password } = req.body;

  try {
    // Вставляем нового пользователя в базу данных
    const [result] = await pool.query(
      'INSERT INTO users (name, username, password) VALUES (?, ?, ?)',
      [name, login, password] // Передаем имя, логин и пароль
    );

    // Запрашиваем добавленного пользователя из базы данных
    const [user] = await pool.query(
      'SELECT name, username, password FROM users WHERE user_id = ?',
      [result.insertId] // Используем insertId для получения ID нового пользователя
    );

    // Возвращаем успешный ответ с ID нового пользователя
    res.status(201).json({ user: user[0] }); // Отправляем данные пользователя
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    res.status(500).json({ error: 'Ошибка при регистрации пользователя' });
  }
});

// Авторизация
app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT name, password FROM users WHERE username = ?', [login]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }

    const user = rows[0];

    // Здесь вы можете использовать библиотеку для хеширования паролей, например bcrypt
    // Для простоты примера мы просто сравниваем строки
    if (user.password !== password) {
      return res.status(401).json({ error: 'Неверный пароль. Верный:' + user.password });
    }

    res.status(200).json({ name: user.name }); // Возвращаем имя пользователя
  } catch (error) {
    console.error('Ошибка при входе:', error);
    res.status(500).json({ error: 'Ошибка при входе' });
  }
});

const storage = multer.memoryStorage(); // Используем память для временного хранения файла
const upload = multer({ storage });

// Отправка файла
app.post('/api/upload', upload.single('file'), async (req, res) => {
  console.log("Запрос пришёл на сервер");
  const userName = req.body.userName; // Получаем имя пользователя
  const file = req.file; // Получаем файл

  if (!file) {
      return res.status(400).json({ message: 'Файл не был загружен' });
  }

  const fileName = file.originalname;

  // 1. Запрос к БД на создание записи
  console.log("Начинаем запрос на запись в БД");
  const query = 'INSERT INTO files (name, fileName) VALUES (?, ?)';
  try {
    const [result] = await pool.query(
      'INSERT INTO files (name, fileName) VALUES (?, ?)',
      [userName, fileName] // Передаем имя пользователя и название файла
    );

    // 2. Отправка файла в контейнер-хранилище
    const formData = new FormData();
    formData.append('file', file.buffer, fileName); // Добавляем файл в форму
    formData.append('userName', userName); // Добавляем имя пользователя
    console.log('Отправляем файл');
    // Обработка запроса axios

    const response = await axios.post('http://file_storage:3001/api/store', formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    res.status(201).json({ user: userName, fileName: fileName }); // Отправляем данные пользователя
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: 'Такой файл уже существует.'});
    } else {
      console.error('Ошибка при создании записи:', error);
      res.status(500).json({ error: 'Ошибка при создании записи' });
    }
  }
});

// Запрос на загрузку файла клиентом
app.post('/api/download', async (req, res) => {
  try {
    const fileName = req.body.fileName;
    const name = req.body.userName;
    console.log(fileName + " " + name);
    const dataToSend = {
      fileName: fileName,
      userName: name
    }
    console.log('Отправляем запрос на загрузку');
    // Обработка запроса axios
    const response = await axios.post('http://file_storage:3001/api/download', dataToSend, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("Обработан запрос");
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Ошибка при запросе файла:', error);
    res.status(500).json({ error: 'Ошибка при запросе файла' });
  }
});

// Получение списка файлов пользователя
app.post('/api/getFileList', async (req, res) => {
  const { userName } = req.body;

  try {
    const [files] = await pool.query('SELECT fileName FROM files WHERE name = ?', [userName]);

    res.status(200).json({ files }); // Возвращаем имя пользователя
  } catch (error) {
    console.error('Ошибка при запросе списка файлов:', error);
    res.status(500).json({ error: 'Ошибка при запросе списка файлов' });
  }
});

// Проверка наличия файла у пользователя
app.post('/api/askForFile', async (req, res) => {
  console.log("Запрос на проверку файла");
  try {
      const fileName = req.body.fileName;
      const name = req.body.userName;
      console.log(fileName + " " + name);
      const dataToSend = {
          fileName: fileName,
          userName: name
      };
      console.log('Запрос на файл');

      // Обработка запроса axios
      const response = await axios.post('http://file_storage:3001/api/askForFile', dataToSend, {
          headers: {
              'Content-Type': 'application/json'
          }
      });

      console.log("Обработан запрос: " + response.status);
      console.log(typeof response.data);
      // Проверяем ответ от хранилища
      if (response.data) {
        console.log("В удаче");
          return res.status(200).send('true'); // Возвращаем 'true', если файл найден
      } else {
        console.log("В неудаче");
          return res.status(200).send('false'); // Возвращаем 'false', если файл не найден
      }
  } catch (error) {
      console.error('Ошибка при запросе файла:', error);
      res.status(500).send('false'); // Возвращаем 'false' в случае исключения
  }
});

// Cохранение курса
app.post('/api/saveCourse', async (req, res) => {
  const { userName, courseName, files } = req.body;

  // Проверка на наличие необходимых данных
  if (!userName || !courseName || !files) {
      return res.status(400).json({ message: 'Недостаточно данных для сохранения курса.' });
  }

  const sql = 'INSERT INTO courses (userName, courseName, files) VALUES (?, ?, ?)';
  const filesString = files; // Здесь files уже строка с названиями файлов через пробел
  console.log("Приступаем к записи курса");

  try {
      await pool.query(sql, [userName, courseName, filesString]);
      res.status(200).json({ message: 'Курс успешно сохранен!' });
  } catch (error) {
      console.error('Ошибка при записи курса:', error);

      // Проверка на уникальность
      if (error.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'Курс с таким названием уже существует для данного пользователя.' });
      }

      // Обработка других ошибок
      res.status(500).json({ error: 'Ошибка при записи курса' });
  }
});

// Обработчик запроса на список курсов
app.post('/api/getCourses', async (req, res) => {
  const userName = req.body.userName;

  const sql = 'SELECT userName, courseName, files FROM courses WHERE userName = ?';
  console.log("Приступаем к получению курсов");
  try {
    const [courses] = await pool.query(sql, [userName]);
    res.status(200).json(courses); // Возвращаем найденные курсы
  } catch (error) {
    console.error('Ошибка при получении курсов:', error);
    res.status(500).json({ error: 'Ошибка при получении курсов' });
  }
});

app.post('/api/askForCourseFiles', async (req, res) => {
  const authorName = req.body.userName;
  const courseName = req.body.courseName;

  const sql = 'SELECT userName, courseName, files FROM courses WHERE userName = ? AND courseName = ?';
  try {
    const [courses] = await pool.query(sql, [authorName, courseName]);
    res.status(200).json(courses); // Возвращаем найденные курсы
  } catch (error) {
    console.error('Ошибка при получении курсов:', error);
    res.status(500).json({ error: 'Ошибка при получении курсов' });
  }
})

// Удаление курса
app.post('/api/deleteCourse', async (req, res) => {
  const { userName, courseName } = req.body;

  const sql = 'DELETE FROM courses WHERE userName = ? AND courseName = ?';

  try {
      const [result] = await pool.query(sql, [userName, courseName]);
      if (result.affectedRows > 0) {
          res.status(200).json({ message: 'Курс успешно удален!' });
      } else {
          res.status(404).json({ message: 'Курс не найден.' });
      }
  } catch (error) {
      console.error('Ошибка при удалении курса:', error);
      res.status(500).json({ error: 'Ошибка при удалении курса' });
  }
});

// Обработчик поиска курсов
app.post('/api/findCourses', async (req, res) => {
  const courseName = req.body.courseName;

  const sql = 'SELECT userName, courseName, files FROM courses WHERE courseName = ?';
  console.log("Приступаем к получению курсов");
  try {
    const [courses] = await pool.query(sql, [courseName]);
    res.status(200).json(courses); // Возвращаем найденные курсы
  } catch (error) {
    console.error('Ошибка при получении курсов:', error);
    res.status(500).json({ error: 'Ошибка при получении курсов' });
  }
});

// Обработка добавления курса в коллекцию
app.post('/api/addCourse', async (req, res) => {
  const { courseName, authorName, userName } = req.body;

  const sql = 'INSERT INTO addedCourses (userName, authorName, courseName) VALUES (?, ?, ?)';
  console.log("Приступаем к добавлению курса");
  try {
    const [courses] = await pool.query(sql, [userName, authorName, courseName]);
    res.status(200).json({message: "Курс добавлен!"});
  } catch (error) {
    console.error('Ошибка при получении курсов:', error);
    res.status(500).json({ error: 'Ошибка при получении курсов' });
  }
});

// Обработчик запроса на список добавленных в коллекцию курсов
app.post('/api/getAddedCourses', async (req, res) => {
  const userName = req.body.userName;

  const sql = 'SELECT authorName, courseName FROM addedCourses WHERE userName = ?';
  console.log("Приступаем к получению курсов");
  try {
    const [courses] = await pool.query(sql, [userName]);
    res.status(200).json(courses); // Возвращаем найденные курсы
  } catch (error) {
    console.error('Ошибка при получении курсов:', error);
    res.status(500).json({ error: 'Ошибка при получении курсов' });
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на http://localhost:${port}`);
});
