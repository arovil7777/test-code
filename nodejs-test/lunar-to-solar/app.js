const lunarToSolar = require("./modules/convert");

// 음력 공휴일
const lunarHolidays = [
    { name: "설 (구정)", year: "2024", month: "01", date: "01" },
    { name: "부처님 오신 날", year: "2024", month: "04", date: "08" },
    { name: "추석", year: "2024", month: "08", date: "15" }
];

function formatDateString(date) {
    return date.toLocaleDateString("kr",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
}

function calculateHolidayDate(year, month, date, offset) {
    const holiday = new Date(lunarToSolar(`${year}${month}${date}`));
    holiday.setDate(holiday.getDate() + offset);
    return formatDateString(holiday);
}

function printHolidayInfo(name, startDate, endDate) {
    console.log(`${name}\nDate: ${startDate} ~ ${endDate}\n`);
}

for (const holiday of lunarHolidays) {
    const { name, year, month, date } = holiday;

    var startDate = "";
    var endDate = "";
    if (name === "설 (구정)" || name === "추석") {
        startDate = calculateHolidayDate(year, month, date, -1);
        endDate = calculateHolidayDate(year, month, date, 2);
    } else {
        startDate = calculateHolidayDate(year, month, date, 0);
        endDate = startDate;
    }
    printHolidayInfo(name, startDate, endDate);
}
