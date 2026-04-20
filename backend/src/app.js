import express from 'express';
import 'dotenv/config';

const app = express();
const port = process.env.PORT || 3000;

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}

app.listen(port, () => {
    console.log(`Server listening at port ${port}`);
})