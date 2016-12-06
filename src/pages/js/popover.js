require("../css/popover.css");
var Vue = require("vue/dist/vue.js");

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
    let now = new Date();
    let date_now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds()); 
    let date_entry; 
    let one_day = 86400000; // milliseconds per days
    
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
        date_entry = new Date(entry.created_utc * 1000).getTime();
        permalinks[i] = {
            permalink: "https://www.reddit.com" + entry.permalink,
            title: entry.title,
            score: entry.score,
            age: ((date_now - date_entry) / one_day).toFixed(1) + " days ago",
            comments: entry.num_comments,
            subreddit: entry.subreddit,
        };
    }

    popover.title = tab.title;
    popover.resubmitURL = "https://www.reddit.com/submit?resubmit=true&url=" + encodeURIComponent(tab.url);
    popover.links = permalinks;

    window.scrollTo(0, 0);
}