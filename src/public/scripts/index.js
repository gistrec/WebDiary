toastr.options = {
	debug: false,
	newestOnTop: false,
	positionClass: "toast-bottom-right",
	closeButton: true,
	progressBar: true
};

// Инициализируем редактор в модальном окне
$('.summernote').summernote({height: 100});

/**
 * Функция сортирует задачи по времени в выбранную дату 
 */
function sortByTime(date) {
	date = date.replace(/\./g, '');
	$('#tasks_' + date + ' li').sort(function(a, b) {
		var aValue = $(a).find('#time').html();
		var bValue = $(b).find('#time').html();
		if (aValue > bValue) return 1;
		if (aValue < bValue) return -1;
		return 0;
	}).appendTo('#tasks_' + date);
}

/**
 * Функция формирует новую задачу из модального окна
 * И добавляем в список задач нужного дня
 * После чего вызывается сортировка для всех задач в нужном дне
 */
function insertTask() {
	// Получаем список задач у определенного дня
	const ol = $('#tasks_' + $('#modal').find('#date').html().replace(/\./g, '')); 
	// Добавляем новую задачу в конец
	ol.append('\
       	<li id="task_' + $('#modal').find('#date').html().replace(/\./g, '') + '_' + $('#modal').find('#time').val().replace(/\:/g, '') + '" class="dd-item" onclick="showTask(this);">\
            <div class="dd-handle">\
                <span id="time" class="pull-left">' + $('#modal').find('#time').val() + '</span>&ensp;\
                <span id="title">' + $('#modal').find('#title').val() + '</span>\
                <span id="description" hidden="true">' + $('#modal').find('.summernote').summernote("code") + '</span>\
                <span id="date" hidden="true">' + $('#modal').find('#date').html() + '</span>\
            </div>\
        </li>');
	// Сортируем день, в который добавили задачу по времени
	sortByTime($('#modal').find('#date').html());
}

/**
 * Вызывается при нажатии на задачу
 * Открываем модальное окно с данными о задаче
 * @var row - объект задачи с данными, которые хранятся в div'ах
 */
function showTask(row) {
	// Получаем данные задачи
	const date  = $(row).find('#date').html();
	const time  = $(row).find('#time').html(); 
	const title = $(row).find('#title').html();
	const description = $(row).find('#description').html();

	// Вызываем модальное окно с данными выбранной задачи
	$('#modal').modal('show');
	$('#modal').find('#name').html('Изменить задачу');
	$('#modal').find('#date').html(date);
	$('#modal').find('#time').val(time);
	$('#modal').find('#old_time').val(time);
	$('#modal').find('#title').val(title);	
	$('#modal').find('#action').html('Изменить');
	$('#modal').find('.summernote').summernote("code", description);
}

/**
 * Вызывается при нажатии на 'плюсик' у дня
 * Открываем моальное окно для создания новой задачи
 * @var date - дата (например 29.01.2019)
 */
function createTask(date) {
	// Вызываем модальное окно с пустыми данными
	$('#modal').modal('show');
	$('#modal').find('#name').html('Создать задачу');

	$('#modal').find('#date').html(date);
	$('#modal').find('#time').val('Время');
	$('#modal').find('#title').val('Название задачи');	
	$('#modal').find('.summernote').summernote("code", "Описание задачи");
	$('#modal').find('#action').html('Добавить');
}

/**
 * Вызывается при нажатии кнопки 'Удалить' в модальном окне
 * Отправляет POST запрос на /delete
 * При ответе 'Ok' удаляет данные о задаче из списка
 */
function deleteTask() {
	const date = $('#modal').find('#date').html();
	const time = $('#modal').find('#old_time').val();

	$.ajax({
	    type: "POST",
	    url: "/delete",
	    data: { date, time },
	    success: function(res) {
	        if (res == 'Ok') {
		        toastr.success("Задача успешно удалена");
		        $('#modal').modal('hide');
		        // Нужно убрать точки и двоеточия
		        $('#task_' + date.replace(/\./g, '') + '_' + time.replace(/\:/g, '')).remove();
		    }else {
		    	toastr.error('Что-то пошло не так');
		    }
	    }
	});
}

/**
 * Функция вызывается при нажатии на кнопку 'Добавить' в модальном окне.
 * Отправляет POST запрос на /add
 * При ответе 'Ok' создает новую задачу с данными из модального окна
 *                            и добавляет в список задач нужного дня
 */
function addTask() {
	$.ajax({
	    type: "POST",
	    url: "/add",
	    data: {
	    	date: $('#modal').find('#date').html(),
			time: $('#modal').find('#time').val(),
			title: $('#modal').find('#title').val(),
			description: $('#modal').find('.summernote').summernote('code')
		},
	    success: function(res) {
	        if (res == 'Ok') {
		        toastr.success("Задача успешно добавлена");
		        $('#modal').modal('hide');
		        insertTask();
		    }else {
		    	toastr.error('Что-то пошло не так');
		    }
	    }
	});
}

/**
 * Вызывается при нажатии 'Изменить' в модальном окне
 * Отправляет POST запрос на /edit
 * При ответе 'Ok' удаляет редактируемую задачу и создает новую 
 *                                             с новыми данными
 */
function editTask() {
	$.ajax({
	    type: "POST",
	    url: "/edit",
	    data: {
	    	date: $('#modal').find('#date').html(),
			time: $('#modal').find('#time').val(),
			old_time: $('#modal').find('#old_time').val(),
			title: $('#modal').find('#title').val(),
			description: $('#modal').find('.summernote').summernote('code')
		},
	    success: function(res) {
	        if (res == 'Ok') {
		        toastr.success("Задача успешно изменена");
		        $('#modal').modal('hide');

		        // Удаляем редактируемую задачу
				$('#task_' + $('#modal').find('#date').html().replace(/\./g, '') + '_' + $('#modal').find('#old_time').val().replace(/\:/g, '')).remove();
				// Добавляем новую задачу из модального окна
				insertTask();
		    }else {
		    	toastr.error('Что-то пошло не так');
		    }
	    }
	});	
}

/**
 * Вызывается при нажатии 'Добавить' или 'Изменить'
 * Определяем что именно нужно выполнить
 */
$('#action').on('click', function () {
	const action = $(this).html(); // Название кнопки
	if (action == 'Добавить') addTask();
	if (action == 'Изменить') editTask();
})

/**
 * Вызывается при нажатии 'Добавить' новый день
 * Отправляем POST запрос на /add_day
 * Если ответ 'Ok' то день добавлен - перезагружаем страницу
 *      ибо писать сортировку - это еще лишние 30 строк кода
 * Если ответ 'Error' то день уже существует
 */
function addDay() {
	const date = $('#modal2').find('#date').val();
	$.ajax({
	    type: "POST",
	    url: "/add_day",
	    data: {	date },
	    success: function(res) {
	        if (res == 'Ok') {
		        toastr.success("День успешно добавлен");
		        $('#modal2').modal('hide');

		        // Перезагружаем страницу
		       	setTimeout(function() {
		            window.location.href = "/index";
		        }, 1000);
		    }else {
	        	toastr.error('День уже существует');
		    }
	    }
	});	
}



/**
 * Функция вызывается при нажатии на 'крестик' у дня
 * Отправляем POST запрос на /delete_day
 * Если ответ 'Ок' то день удален - перезагружаем страницу
 */
function deleteDay(date) {
	$.ajax({
	    type: "POST",
	    url: "/delete_day",
	    data: {	date },
	    success: function(res) {
	        if (res == 'Ok') {
		        toastr.success("День успешно удален");

		        // Перезагружаем страницу
		       	setTimeout(function() {
		            window.location.href = "/index";
		        }, 1000);
		    }
	    }
	});	
}