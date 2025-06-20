// filepath: c:\Users\ADMIN\Desktop\my-food-app\my-food-app\server\db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',        // đổi thành user MySQL của bạn
    password: '123456',        // đổi thành mật khẩu MySQL của bạn
    database: 'my_food_app',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;