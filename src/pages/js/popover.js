require("../css/popover.css");
var Vue = require("vue/dist/vue.js");

const time_formats = [
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

var popover;
document.addEventListener("DOMContentLoaded", function(event) {
    popover = new Vue({
        el: "#app",
        data: {
            title: "Placeholder Title",
            resubmitURL: "",
            links: [{
                permalink: "",
                title: "You shouldn't be seeing this.",
                score: "0",
                age: "0 days ago",
                comments: 0,
                subreddit: "commentsfromreddit"
            }]
        },
        methods: {
            openURL: function (event) {
                safari.self.hide();
                safari.application.activeBrowserWindow.openTab().url = event.target.href;
            }
        }
    });
});

window.addEventListener("message", function (msg) {
    renderDiscussions(msg.data.discussions, msg.data.tab);
}, false);

function renderDiscussions(discussions, tab) {
    let orderIn = safari.extension.settings.orderIn;
    let orderUsing = safari.extension.settings.orderUsing;

    if (orderUsing == "created_utc") {
        orderIn = (orderIn == "asc" ? "desc" : "asc"); // toggle orders to handle timestamps being inverse
    }

    let keysSorted = [];
    if (orderIn == "asc") {
        keysSorted = Object.keys(discussions).sort(function(a, b){
            return discussions[a].data[orderUsing] - discussions[b].data[orderUsing];
        });
    } else if (orderIn == "desc") {
        keysSorted = Object.keys(discussions).sort(function(a, b){
            return discussions[b].data[orderUsing] - discussions[a].data[orderUsing];
        });
    }

    let permalinks = [];
    for (let i = 0; i < keysSorted.length; i++) {
        let entry = discussions[keysSorted[i]].data;

        permalinks[i] = {
            permalink: "https://www.reddit.com" + entry.permalink,
            title: entry.title,
            score: formatScore(entry.score),
            age: formatAge(new Date(entry.created_utc * 1000)),
            comments: entry.num_comments.toLocaleString(),
            subreddit: entry.subreddit,
        };
    }

    popover.title = tab.title;
    popover.resubmitURL = "https://www.reddit.com/submit?resubmit=true&url=" + encodeURIComponent(tab.url);
    popover.links = permalinks;

    window.scrollTo(0, 0);
}

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
    let list_choice = 1;

    if (seconds == 0) {
        return "Just now";
    }

    if (seconds < 0) {
        seconds = Math.abs(seconds);
        token = "from now";
        list_choice = 2;
    }

    let i = 0
    let format;
    while (format = time_formats[i++]) {
        if (seconds < format[0]) {
            if (typeof format[2] == "string") {
                return format[list_choice];
            } else {
                return Math.floor(seconds / format[2]) + " " + format[1] + " " + token;
            }
        }
    }

    return time;
}