const courseInput = document.getElementById('course-name');
const findCourseButton = document.getElementById('find-course-btn');
const foundCoursesContainer = document.getElementById('course-list-container');

findCourseButton.addEventListener('click', async function () {
  const courseName = courseInput.value;

  if (courseName.length === 0) {
    alert("Введите название курса!");
    return;
  }

  try {
    const response = await fetch('/api/findCourses', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({courseName: courseName})
    });
    if (response.ok) {
      const result = await response.json();
      console.log("Результат:", result);
      renderFoundCourseList(result, "course-list");
    } else {
      console.error('Ошибка при получении курсов:', response.statusText);
    }
  } catch (error) {
    console.error('Ошибка при отправке запроса на получение курсов:', error);
  }
});

function renderFoundCourseList(courses, containerId) {
  const courseListContainer = document.getElementById(containerId); // Получаем контейнер для списка курсов
  courseListContainer.innerHTML = ''; // Очищаем текущий список курсов
  // Обновляем список курсов
  courses.forEach(course => {
      const courseItem = document.createElement('div');
      courseItem.classList.add('course-item'); // Добавляем класс для стилизации
      foundCoursesContainer.style.display = 'block';

      // Создаем заголовок для названия курса
      const courseTitle = document.createElement('h3');
      courseTitle.textContent = course.courseName;
      courseItem.appendChild(courseTitle);

      // Добавляем имя автора курса
      const courseAuthor = document.createElement('h3');
      courseAuthor.textContent = `Автор: ${course.userName}`;
      courseItem.appendChild(courseAuthor);

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

      // Создаём кнопку добавления курса
      const addButton = document.createElement('button');
      addButton.textContent = "Добавить курс";
      addButton.addEventListener('click', () => {
        addCourse(course.courseName, course.userName);
      });
      courseItem.appendChild(addButton);

      // Добавляем элемент курса в контейнер
      courseListContainer.appendChild(courseItem);
  });
}

async function addCourse(courseName, authorName) {
  try {
    const response = await fetch('/api/addCourse', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({courseName: courseName, authorName: authorName, userName: localStorage.userName})
    });
    if (response.ok) {
      const result = await response.json();
      console.log("Результат:", result);
    } else {
      console.error('Ошибка при получении курсов:', response.statusText);
    }
  } catch (error) {
    console.error('Ошибка при отправке запроса на получение курсов:', error);
  }
}

document.addEventListener('DOMContentLoaded', updateCourseList);

// Обновление списка курсов
async function updateCourseList() {
  const userName = localStorage.userName; // Получаем имя пользователя из localStorage

  try {
      const response = await fetch(`/api/getAddedCourses`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({userName: localStorage.userName})
      });

      if (response.ok) {
          const courses = await response.json();
          courses.forEach((course) => {
            askForCourse(course.authorName, course.courseName)
          });
          console.log(courses);
      } else {
          console.error('Ошибка при получении курсов:', response.statusText);
      }
  } catch (error) {
      console.error('Ошибка при отправке запроса на получение курсов:', error);
  }
}

async function askForCourse(userName, courseName) {
    try {
      const response = await fetch(`/api/askForCourseFiles`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({userName: userName, courseName: courseName})
    });

    if (response.ok) {
        const courses = await response.json();
        courses.forEach((course) =>{
          addCourseToList(course);
        })
    } else {
        console.error('Ошибка при получении курсов:', response.statusText);
    }
    } catch (error) {
        console.error('Ошибка при отправке запроса на получение курсов:', error);
    }
}

function addCourseToList(course) {
  const courseListContainer = document.getElementById('saved-course-list'); // Получаем контейнер для списка курсов
  // Обновляем список курсов
      console.log(course);
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

      // Добавляем элемент курса в контейнер
      courseListContainer.appendChild(courseItem);
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