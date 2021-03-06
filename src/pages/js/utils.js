const timeFormats = [
    [60, "seconds", 1], // 60
    [120, "1 minute ago", "1 minute from now"], // 60*2
    [3600, "minutes", 60], // 60*60, 60
    [7200, "1 hour ago", "1 hour from now"], // 60*60*2
    [86400, "hours", 3600], // 60*60*24, 60*60
    [172800, "1 day ago", "1 day from now"], // 60*60*24*2
    [604800, "days", 86400], // 60*60*24*7, 60*60*24
    [1209600, "1 week ago", "1 week from now"], // 60*60*24*7*4*2
    [2419200, "weeks", 604800], // 60*60*24*7*4, 60*60*24*7
    [4838400, "1 month ago", "1 month from now"], // 60*60*24*7*4*2
    [29030400, "months", 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
    [58060800, "1 year ago", "1 year from now"], // 60*60*24*7*4*12*2
    [2903040000, "years", 29030400] // 60*60*24*7*4*12*100, 60*60*24*7*4*12
];

function formatScore(num) {
    return num > 999 ? (num/1000).toFixed(1) + "k" : num;
}

function formatAge(time) {
    switch (typeof time) {
        case "number": break;
        case "string": time = +new Date(time); break;
        case "object": if (time.constructor === Date) time = time.getTime(); break;
        default: time = +new Date();
    }

    let seconds = (+new Date() - time) / 1000;
    let token = "ago";
    let listChoice = 1;

    if (seconds === 0) {
        return "Just now";
    }

    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = "from now";
        listChoice = 2;
    }

    for (let i = 0; i < timeFormats.length; i++) {
        let format = timeFormats[i];

        if (seconds < format[0]) {
            if (typeof format[2] == "string") {
                return format[listChoice];
            } else {
                return Math.floor(seconds / format[2]) + " " + format[1] + " " + token;
            }
        }
    }

    return time;
}

export { formatScore, formatAge }