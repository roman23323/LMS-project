document.getElementById('loginBtn').addEventListener('click', function() {
  document.getElementById('loginForm').style.display = 'block';
  document.getElementById('registerForm').style.display = 'none';
});

document.getElementById('registerBtn').addEventListener('click', function() {
  document.getElementById('registerForm').style.display = 'block';
  document.getElementById('loginForm').style.display = 'none';
});

function closeForm() {
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('registerForm').style.display = 'none';
}

function submitLogin() {
  const login = document.getElementById('auth-login').value;
  const password = document.getElementById('auth-password').value;

  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ login, password }),
  })
  .then(response => {
    if (!response.ok) {
      return response.json().then(errorData =>{
        throw new Error(errorData.error || 'Ошибка при входе');
      })
    }
    return response.json(); // Преобразуем ответ в JSON
  })
  .then(data => {
    console.log('Успешный вход 0');
    localStorage.setItem('userName', data.name);
    console.log(0);
    console.log(localStorage.getItem('userName') + "0" + data.name)
    alert('Добро пожаловать!');
    closeForm();
  })
  .catch(error => {
    console.error('Ошибка:', error);
    alert(error.message); // Показываем сообщение об ошибке
  });
}

function submitRegister() {
  const name = document.getElementById('reg-name').value;
  const login = document.getElementById('reg-login').value;
  const password = document.getElementById('reg-password').value;
  
  const userData = {
    name: name,
    login: login,
    password: password
  };

  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json' // Указываем, что отправляем JSON
    },
    body: JSON.stringify(userData) // Преобразуем объект в строку JSON
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Ошибка при регистрации');
    }
    return response.json(); // Преобразуем ответ в JSON
  })
  .then(data => {
    console.log('Успешная регистрация:', data);
    alert('Регистрация завершена!');
    closeForm();
  })
  .catch(error => {
    console.error('Ошибка:', error);
    alert('Произошла ошибка при регистрации. Попробуйте снова.');
  });

  alert('Регистрация завершена!');
  closeForm();
}