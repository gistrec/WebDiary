/**
 * Функция, которая сортирует по строке, пробразованной в дату
 * Т.е. фиксим стандартное сравнение строк, чтобы не было проблем
 *               при сравнении, например, 29.10.2019 > 01.10.2019
 */
exports.compareDate = function(a, b) {
    var a = a.split('.').reverse().join('.');
    var b = b.split('.').reverse().join('.');

    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
}