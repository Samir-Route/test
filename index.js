import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import bootstrap from './src/app.controller.js';

//hi
//hi again
// Load environment variables
dotenv.config({path:path.resolve('./src/config/.env')});

const app = express();
const PORT = process.env.PORT ;

bootstrap(app, express);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});