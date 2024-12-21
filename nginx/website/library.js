// Загрузка файла
document.getElementById('uploadForm').addEventListener('submit', async (event) => {
    event.preventDefault(); // Предотвращаем стандартное поведение формы
    
    const fileInput = document.getElementById('fileInput');
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('userName', localStorage.getItem('userName')); // Добавляем имя пользователя

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (response.ok) {
            alert('Файл загружен успешно: ' + result.fileName);
            refreshFileList();
        } else {
            alert('Ошибка при загрузке файла: ' + result.error);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при загрузке файла');
    }
});

// Запрос списка файлов пользователя
document.addEventListener('DOMContentLoaded', refreshFileList);
async function refreshFileList() {
    try {
        console.log("Запрос на список отправлен");
        const response = await fetch('/api/getFileList', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({userName: localStorage.userName})
        });
        if (response.ok) {
            const result = await response.json();
            console.log("Результат:", result);

            // Получаем контейнер для вывода файлов
            const fileListContainer = document.querySelector('.file-list');

            // Проверяем, есть ли файлы и выводим их
            if (result.files && result.files.length > 0) {
                fileListContainer.innerHTML = ''; // Очищаем контейнер перед добавлением данных
                result.files.forEach(file => {
                    const fileItem = document.createElement('div'); // Создаем элемент для файла
                    fileItem.textContent = file.fileName; // Устанавливаем текст
                    const button = document.createElement('button');
                    button.id = "download-button";
                    button.textContent = "Скачать файл"
                    fileItem.appendChild(button);
                    button.style.marginLeft = "10px";
                    fileListContainer.appendChild(fileItem); // Добавляем элемент в контейнер
                });
            } else {
                fileListContainer.textContent = 'Нет файлов для отображения.'; // Сообщение, если файлов нет
            }
        } else {
            console.error('Ошибка при получении данных:', response.statusText);
        }
    } catch (error) {
        console.error('Ошибка при запросе списка файлов:', error);
    }
}

// Скачивание файла
document.querySelector(".file-list").addEventListener('click', async function (event) {
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