import express from 'express';
import router from './Routes/listingRoutes.js';

const app = express();
const port = process.env.PORT || 3000;

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
}

app.use('/uploads', express.static('uploads'));
app.use('/api/listings', router);

app.listen(port, () => {
    console.log(`Server listening at port ${port}`);
})

export default app;