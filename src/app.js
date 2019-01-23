const express = require('express');
const ejs = require('ejs');
const app = express();

const cookieParser = require('cookie-parser')
const bodyParser   = require('body-parser')


const JsonDB = require('node-json-db');
const db = new JsonDB("database", true, true);

const utils = require('./utils.js');

app.set('view engine', 'ejs'); // set the view engine to ejs
app.set('views', require("path").join(__dirname, '/public'));

app.use(express.static('public'));
app.use(cookieParser('wCzLteJwmfOzaor4')) // Secret key
app.use(bodyParser.json()); // To support JSON-encoded bodies
app.use(bodyParser.urlencoded({   // To support URL-encoded bodies
    extended: true
}));

var moment = require('moment');
require('moment/locale/ru');

/**
 * Middleware, проверяем авторзиацию
 * Добавляем переменные req.auth
 */
app.use((req, res, next) => {
	// Если в куки нет логина или пароля
	if (!req.cookies.login || !req.cookies.passwd) {
		req.auth = false;
	}else {
		try {
			const passwd = db.getData('/auth/' + req.cookies.login);
			if (passwd == req.cookies.passwd) req.auth = true;
			else req.auth = false;
		}catch(error) {
			req.auth = false;
		}
	}
	next();
})

/**
 * Отдаем страницу login.ejs
 */
app.get('/login', (req, res) => {
	if (req.auth) return res.redirect('/index');
	res.render('login');
})

/**
 * Отдаем страницу register.ejs
 */
app.get('/register', (req, res) => {
	if (req.auth) return res.redirect('/index');
	res.render('register');
})

/**
 * Middleware, получаем данные пользователя
 * Добавляем переменную req.data
 */
app.use((req, res, next) => {
	if (req.auth) {
		req.data = db.getData('/data/' + req.cookies.login);
	}
	next();
})

app.get('/index', (req, res) => {
	if (!req.auth) return res.redirect('/login');
    
	res.render('index', {data: req.data, moment, compareDate: utils.compareDate});
})

/**
 * Post запрос на вход
 * @param login  - логин
 * @param passwd - пароль
 */
app.post('/login', (req, res) => {
	try {
		const passwd = db.getData('/auth/' + req.body.login);
		// Если пароли не совпадают
		if (passwd != req.body.passwd) return res.send('Error')
		
		// Устанавливаем куки
		res.cookie('login',  req.body.login,  { maxAge: 900000, httpOnly: false});
		res.cookie('passwd', req.body.passwd, { maxAge: 900000, httpOnly: false});
		res.send('Ok');
	}catch (error) {
		res.send('Error')
	}
})

/**
 * Post запрос на регистрацию
 * @param login  - логин
 * @param passwd - пароль
 * @param mail   - почта
 */
app.post('/register', (req, res) => {
	try {
		db.getData('/auth/' + req.body.login);
		res.send('Error');
	}catch (error) {
		// Добавляем новую запись в бд
		db.push("/auth/" + req.body.login, req.body.passwd);
		db.push("/data/" + req.body.login, {});
		// Устанавлвиаем куки
		res.cookie('login',  req.body.login,  { maxAge: 900000, httpOnly: false});
		res.cookie('passwd', req.body.passwd, { maxAge: 900000, httpOnly: false});
		res.send("Ok")
	}
})

/**
 * Удаляем задачу
 * @param date - дата, к которой принадлежит задача
 * @param time - время, на которое создана задача
 */
app.post('/delete', (req, res) => {
	if (!req.auth) return res.redirect('/login');

	db.delete('/data/' + req.cookies.login + '/' + req.body.date + '/' + req.body.time);
	res.send('Ok');
})

/**
 * Создаем задачу
 * @param date - дата
 * @param time - время
 * @param title - название
 * @param description - описание
 */
app.post('/add', (req, res) => {
	if (!req.auth) return res.redirect('/login');

	db.push('/data/' + req.cookies.login + '/' + req.body.date + '/' + req.body.time, 
		{title: req.body.title, description: req.body.description});

	res.send('Ok');
})

/**
 * Изменяем задачу
 * @param date - дата
 * @param old_time - старое время
 * @param time  - время
 * @param title - название
 * @param description - описание
 */
app.post('/edit', (req, res) => {
	if (!req.auth) return res.redirect('/login');

	// Удаляем старую 
	db.delete('/data/' + req.cookies.login + '/' + req.body.date + '/' + req.body.old_time);
	// Добавляем новую
	db.push('/data/' + req.cookies.login + '/' + req.body.date + '/' + req.body.time, 
		{title: req.body.title, description: req.body.description});

	res.send('Ok');
})

app.listen(8080);
console.log('WebDiary start on 8080 port');