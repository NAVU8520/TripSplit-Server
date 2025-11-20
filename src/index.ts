import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import router from './routes/index.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', router);

app.get('/', (req, res) => {
    res.send('TripSplit API is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
