  const addCourseBtn = document.getElementById('add-course-btn');
  const fileInputContainer = document.getElementById('file-input-container');
  const addFileBtn = document.getElementById('add-file-btn');
  const fileNameInput = document.getElementById('file-name');
  const fileList = document.getElementById('file-list');
  const filesHeader = document.getElementById('files-header');
  const saveCourseBtn = document.getElementById('save-course-btn');
  const courseNameInput = document.getElementById('course-name');

  let files = []; // Массив для хранения добавленных файлов
  // Обработчик события для кнопки "Добавить курс"
  addCourseBtn.addEventListener('click', function() {
      fileInputContainer.style.display = 'block'; // Показываем контейнер для ввода файла
  });

  // Обработчик события для кнопки "Добавить файл в курс"
  addFileBtn.addEventListener('click', async function() {
    const fileName = fileNameInput.value.trim(); // Получаем название файла
    const fileExists = await askForFile(fileName); // Ждем результат запроса

    if (fileExists) {
        // Создаем новый элемент списка
        const listItem = document.createElement('div');
        listItem.textContent = fileName; // Устанавливаем текст элемента списка
        fileList.appendChild(listItem); // Добавляем элемент в список

        files.push(fileName);
    } else {
        alert('У вас нет такого файла'); // Предупреждение, если файл не найден
    }

    // Очищаем поле ввода
    fileNameInput.value = '';

    if (files.length > 0) {
      filesHeader.style.display = 'block'; // Показываем заголовок
      courseNameInput.style.display = 'block'; // Показываем поле для ввода названия курса
      saveCourseBtn.style.display = 'block'; // Показываем кнопку "Сохранить курс"
    }
});

async function askForFile(fileName) {
    if (!fileName) {
      return false;
    }
    try {
        console.log("Запрос на файл отправлен");
        const response = await fetch('/api/askForFile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userName: localStorage.userName, fileName: fileName })
        });

        if (response.ok) {
            const result = await response.text(); // Получаем ответ как текст
            console.log("Результат:", result);
            return result === 'true'; // Возвращаем true, если ответ 'true', иначе false
        } else {
            console.error('Ошибка при получении данных:', response.statusText);
            return false; // Файл не найден
        }
    } catch (error) {
        console.error('Ошибка при запросе списка файлов:', error);
        return false; // Ошибка при запросе
    }
}

// Сохранение курса
saveCourseBtn.addEventListener('click', async function() {
  const courseName = courseNameInput.value.trim(); // Получаем название курса

  if (courseName && files.length > 0) {
      const userName = localStorage.userName; // Получаем имя пользователя из localStorage

      // Создаем объект с данными для отправки
      const data = {
          userName: userName,
          courseName: courseName,
          files: files.join(' ') // Объединяем названия файлов через пробел
      };

      try {
          console.log("Начинаем запрос на сохранение курса");
          const response = await fetch('/api/saveCourse', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(data) // Преобразуем объект в JSON
          });
          console.log("Закончили");

          // Обработка ответа от сервера
          if (response.ok) {
              const result = await response.json();
              console.log("Курс успешно сохранен:", result);
              alert('Курс успешно сохранен!');
              await updateCourseList(); // Обновляем список курсов

              // Очистка полей после успешного сохранения
              courseNameInput.value = '';
              fileList.innerHTML = ''; // Очищаем список файлов
              files = []; // Очищаем массив файлов
              saveCourseBtn.style.display = 'none'; // Скрываем кнопку "Сохранить курс"
              courseNameInput.style.display = 'none'; // Скрываем поле для ввода названия курса
              filesHeader.style.display = 'none';
          } else {
              const errorResult = await response.json(); // Получаем текст ошибки
              console.error('Ошибка при сохранении курса:', errorResult.message);
              
              // Обработка различных ошибок
              if (response.status === 400) {
                  alert('Недостаточно данных для сохранения курса. Пожалуйста, проверьте введенные данные.');
              } else if (response.status === 409) {
                  alert('Курс с таким названием уже существует для данного пользователя.');
              } else {
                  alert('Ошибка при сохранении курса. Попробуйте еще раз.');
              }
          }
      } catch (error) {
          console.error('Ошибка при отправке запроса:', error);
          alert('Ошибка при отправке запроса. Попробуйте еще раз.');
      }
  } else {
      alert('Пожалуйста, введите название курса и добавьте хотя бы один файл.'); // Предупреждение, если поля пустые
  }
});

document.addEventListener('DOMContentLoaded', updateCourseList);

// Обновление списка курсов
async function updateCourseList() {
  const userName = localStorage.userName; // Получаем имя пользователя из localStorage

  try {
      const response = await fetch(`/api/getCourses`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({userName: localStorage.userName})
      });

      if (response.ok) {
          const courses = await response.json();
          renderCourseList(courses, 'course-list');
      } else {
          console.error('Ошибка при получении курсов:', response.statusText);
      }
  } catch (error) {
      console.error('Ошибка при отправке запроса на получение курсов:', error);
  }
}

function renderCourseList(courses, containerId) {
  const courseListContainer = document.getElementById(containerId); // Получаем контейнер для списка курсов
  if (courses.legth > 0) {
      courseListContainer.innerHTML = ''; // Очищаем текущий список курсов
  }
  // Обновляем список курсов
  courses.forEach(course => {
      const courseItem = document.createElement('div');
      courseItem.classList.add('course-item'); // Добавляем класс для стилизации

      // Создаем заголовок для названия курса
      const courseTitle = document.createElement('h3');
      courseTitle.textContent = course.courseName;
      courseItem.appendChild(courseTitle);

      // Создаем подзаголовок "Файлы"
      const filesSubtitle = document.createElement('h4');
      filesSubtitle.textContent = 'Файлы:';
      courseItem.appendChild(filesSubtitle);

      // Создаем список файлов
      const filesList = document.createElement('div');
      const filesArray = course.files.split(' '); // Предполагаем, что файлы хранятся через пробел
      filesArray.forEach(file => {
          const fileItem = document.createElement('p');
          fileItem.textContent = file; // Добавляем название файла
          const button = document.createElement('button');
          button.id = "download-button";
          button.textContent = "Скачать файл"
          fileItem.appendChild(button);
          button.style.marginLeft = "10px";
          filesList.appendChild(fileItem);

      });
      courseItem.appendChild(filesList);
      
      // Кнопка удаления курса
      const deleteButton = document.createElement('button');
      deleteButton.id = "delete-button";
      deleteButton.textContent = "Удалить курс";
      deleteButton.addEventListener('click', async () => {
        await deleteCourse(course.courseName); // Вызываем функцию удаления курса
      });
      courseItem.appendChild(deleteButton);

      // Добавляем элемент курса в контейнер
      courseListContainer.appendChild(courseItem);
  });
}

// Функция для удаления курса
async function deleteCourse(courseName) {
  const userName = localStorage.userName; // Получаем имя пользователя из localStorage

  try {
      const response = await fetch('/api/deleteCourse', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userName, courseName }) // Отправляем данные на сервер
      });

      if (response.ok) {
          const result = await response.json();
          console.log("Курс успешно удален:", result);
          alert('Курс успешно удален!');
          await updateCourseList(); // Обновляем список курсов после удаления
      } else {
          console.error('Ошибка при удалении курса:', response.statusText);
          alert('Ошибка при удалении курса. Попробуйте еще раз.');
      }
  } catch (error) {
      console.error('Ошибка при отправке запроса на удаление курса:', error);
      alert('Ошибка при отправке запроса на удаление курса. Попробуйте еще раз.');
  }
}

// Скачивание файла
document.getElementById("course-list").addEventListener('click', async function (event) {
  if (event.target.id === 'download-button') {
      // Получаем текст кнопки, на которую нажали
      const fileName = event.target.previousSibling.textContent; // Получаем текст элемента перед кнопкой
      
      try {
          const response = await fetch('/api/download', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({userName: localStorage.userName, fileName: fileName})
          });

          if (!response.ok) {
              throw new Error('Ошибка при загрузке файла');
          }

          // Создаем ссылку для скачивания
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName; // Указываем имя файла для скачивания
          document.body.appendChild(a);
          a.click(); // Имитируем клик по ссылке
          a.remove(); // Удаляем ссылку после скачивания
          window.URL.revokeObjectURL(url); // Освобождаем память
      } catch (error) {
          console.error('Ошибка:', error);
          alert('Ошибка при загрузке файла');
      }

  }
});

