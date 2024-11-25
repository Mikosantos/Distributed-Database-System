import express from 'express';
import dotenv from 'dotenv';
import router from './control/routes.js';
import bodyParser from 'body-parser';

const app = express();
dotenv.config();

app.set('view engine', 'ejs');
app.set('access', 0);
app.set('config', [true, true, true]);
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use('/',router);

app.listen(3000, () =>{
    console.log("Server listening on port 3000.");
});