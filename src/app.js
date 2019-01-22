const express = require('express');
const ejs = require('ejs');
const app = express();

const cookieParser = require('cookie-parser')
const bodyParser   = require('body-parser')


const JsonDB = require('node-json-db');
const db = new JsonDB("database", true, true);

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
app.get('/login(\.html)?', (req, res) => {
	if (req.auth) return res.redirect('/index');
	res.render('login');
})

/**
 * Post запрос на вход
 * @param login  - логин
 * @param passwd - пароль
 * $return Error || Ok
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
 * Отдаем страницу register.ejs
 */
app.get('/register(\.html)?', (req, res) => {
	if (req.auth) return res.redirect('/index');
	res.render('register');
})

/**
 * Post запрос на регистрацию
 * @param login  - логин
 * @param passwd - пароль
 * @param mail   - почта
 * $return Error || Ok
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

	res.render('index', {data: req.data, moment});
})

//app.use((req, res) => {
//	res.redirect('/index');
//})

app.listen(8080);
console.log('WebDiary start on 8080 port');