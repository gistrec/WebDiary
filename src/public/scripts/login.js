toastr.options = {
	debug: false,
	newestOnTop: false,
	positionClass: "toast-bottom-right",
	closeButton: true,
	progressBar: true
};


$("#username, #password").change(function() {
	$(this).css("border", "");
});


$("#loginForm").submit(function(e) {
    e.preventDefault(); // Отменяем отправку формы
    var error = 0;

    var username = $("#username").val();
    if (username.length < 5 || username.length > 20) {
        error++;
        $("#username").css("border", "1.5px solid red");
        toastr.error("Логин должен быть от 5 до 20 символов");
    }

    var password = $("#password").val();
    if (password.length < 5 || password.length > 30) {
        error++;
        $("#password").css("border", "1.5px solid red");
        toastr.error("Пароль должен быть от 5 до 20 символов");
    }

    if (error > 0) return;
    // $("button").prop("disabled", true);

	$.ajax({
	    type: "POST",
	    url: "/login",
	    data: {
            login: username,
            passwd: password 
        },
	    success: function(res) {
	        if (res == 'Ok') {
		        toastr.success("Авторизация прошла успешно");
		        setTimeout(function() {
		            window.location.href = "/index";
		        }, 1000);
		    }else if (res == 'Error') {
		        toastr.error("Логин или пароль введены неверно");
		        $("button").prop("disabled", false);
	      	}
	    }
	});
});
