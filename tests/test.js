const request = require('supertest');

describe('POST /api/register', () => {
    const baseUrl = 'http://localhost:3000'; // Укажите URL вашего развернутого приложения

    it('should register a new user and return user data', async () => {
        const newUser = {
            name: 'Test User',
            login: 'testuser',
            password: 'password123'
        };

        const response = await request(baseUrl) // Используем базовый URL
            .post('/api/register')
            .send(newUser)
            .set('Accept', 'application/json');

        // Проверяем статус ответа
        expect(response.status).to.equal(201);
        
        // Проверяем, что возвращаемые данные содержат нужные поля
        expect(response.body).to.have.property('user');
        expect(response.body.user).to.have.property('name', newUser.name);
        expect(response.body.user).to.have.property('username', newUser.login);
    });

    it('should return 500 if there is an error', async () => {
        const response = await request(baseUrl) // Используем базовый URL
            .post('/api/register')
            .send({}); // Отправляем пустой объект, чтобы вызвать ошибку

        expect(response.status).to.equal(500);
        expect(response.body).to.have.property('error', 'Ошибка при регистрации пользователя');
    });
});
// d3faf4d76e90442cb38c21748e5fbe72