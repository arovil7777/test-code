const lunarToSolar = require("./modules/convert");

// 양력 공휴일
const koreanHolidays = [
    { name: "설 (신정)", month: "01", date: "01" },
    { name: "설 (구정)", month: "01", date: "01" },
    { name: "삼일절", month: "03", date: "01" },
    { name: "어린이날", month: "05", date: "05" },
    { name: "부처님 오신 날", month: "04", date: "08" },
    { name: "현충일", month: "06", date: "06" },
    { name: "광복절", month: "08", date: "15" },
    { name: "추석", month: "08", date: "15" },
    { name: "개천절", month: "10", date: "03" },
    { name: "한글날", month: "10", date: "09" },
    { name: "크리스마스", month: "12", date: "25" }
];

function formatDateString(date) {
    return date.toLocaleDateString("kr",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
        });
}

function calculateHolidayDate(year, month, date, offset, isLunar) {
    const holiday = isLunar
        ? new Date(lunarToSolar(`${year}${month}${date}`))
        : new Date(`${year}-${month}-${date}`);

    holiday.setDate(holiday.getDate() + offset);
    return formatDateString(holiday);
}

function printHolidayInfo(name, startDate, endDate) {
    console.log(`${name}\nDate: ${startDate} ~ ${endDate}\n`);
}

for (const holiday of koreanHolidays) {
    const { name, month, date } = holiday;
    const nowDate = new Date();

    let startDate, endDate;

    if (name === "설 (구정)" || name === "추석") {
        startDate = calculateHolidayDate(nowDate.getFullYear(), month, date, -1, true);
        endDate = calculateHolidayDate(nowDate.getFullYear(), month, date, 1, true);
    } else if (name === "부처님 오신 날") {
        startDate = calculateHolidayDate(nowDate.getFullYear(), month, date, 0, true);
        endDate = startDate;
    } else {
        startDate = calculateHolidayDate(nowDate.getFullYear(), month, date, 0, false);
        endDate = startDate;
    }

    printHolidayInfo(name, startDate, endDate);
}
