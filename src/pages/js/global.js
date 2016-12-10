localStorage.clear();
const ytRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
var discussions = {};

var blacklist = safari.extension.settings.blacklist.split(" ");
safari.extension.settings.addEventListener("change", settingChanged, false);
function settingChanged(event) {
    if (event.key == "blacklist") {
        blacklist = event.newValue.split(" ");
    }
}

var lastUrl = "";
setInterval(checkURL, 1000);
function checkURL() {
    if (safari.application.activeBrowserWindow.activeTab.url) {
        let newUrl = safari.application.activeBrowserWindow.activeTab.url.split("#")[0];
        if (lastUrl !== newUrl) {
            let currentURL = new URL(newUrl);

            if (blacklist.indexOf(currentURL.hostname) > -1) {
                setBadge(null, true);
            } else {
                getURLInfo(newUrl);
            }

            lastUrl = newUrl;
        }
    } else {
        discussions = {};
        setBadge(null, true);
    }
}

function setBadge(badge, disabled) {
    let itemArray = safari.extension.toolbarItems;
    for (let i = 0; i < itemArray.length; ++i) {
        let item = itemArray[i];
        if (item.identifier == "discussionsCount") {
            item.badge = badge;
            item.disabled = disabled;
        }
    }
}

function getURLInfo(newUrl, forceRefresh = false) {
    let currentPosts = [];

    let urls = constructURLs(newUrl);
    for (let i = 0; i < urls.length; i++) {
        if (forceRefresh) {
            currentPosts = currentPosts.concat(fetchPosts(urls[i]));
            continue;
        }

        let cacheCheck = localStorage.getItem(urls[i]);
        if (cacheCheck) {
            let cachedPosts = JSON.parse(cacheCheck);

            if ((Math.floor(Date.now() / 1000) - cachedPosts["time"]) > 3600) {
                currentPosts = currentPosts.concat(fetchPosts(urls[i]));
            } else {
                currentPosts = currentPosts.concat(cachedPosts["posts"]);
            }
        } else {
            currentPosts = currentPosts.concat(fetchPosts(urls[i]));
        }
    }

    discussions = {};
    for (let i = 0; i < currentPosts.length; i++) {
        discussions[currentPosts[i].data.name] = currentPosts[i];
    }

    let discussionsCount = Object.keys(discussions).length;
    if (discussionsCount > 0) {
        setBadge(discussionsCount, false);
    } else {
        setBadge(null, true);
    }

    if (forceRefresh) {
        pushDiscussions();
    }
}

function constructURLs(url) {
    if (url.indexOf("http") == -1) {
        return [];
    }

    let urls = [url];
    urls.push(url.replace(/^(https?:|)\/\//, ""));

    if (url.indexOf("youtube.com") != -1) {
        urls = urls.concat(getYouTubeURLs(url));
    }

    return urls;
}

function getYouTubeURLs(url) {
    let urls = [];

    let match = url.match(ytRegex);
    if (match && match[2].length == 11) {
        let id = match[2];

        urls.push("https://youtube.com/watch?v=" + id);
        urls.push("https://youtu.be/" + id);
        urls.push("https://youtube.com/v/" + id);
        urls.push("https://youtube.com/embed/" + id);
    }

    return urls;
}

function fetchPosts(url) {
    let infoRequest = new XMLHttpRequest();
    infoRequest.open("GET", "https://www.reddit.com/api/info.json?url=" + url, false);
    infoRequest.send();

    if (infoRequest.readyState == 4 && infoRequest.status == 200) {
        let jsonInfo = JSON.parse(infoRequest.responseText);

        try {
            localStorage.setItem(url, JSON.stringify({
                time: Math.floor(Date.now() / 1000),
                posts: jsonInfo.data.children
            }));
        } catch (e) {
            localStorage.clear();
        }

        return jsonInfo.data.children;
    } else {
        return [];
    }
}

window.addEventListener("message", function (msg) {
    getURLInfo(msg.data.url, true);
}, false);

safari.application.addEventListener("popover", popoverEvent, false);
function popoverEvent(event) {
    pushDiscussions();
}

function pushDiscussions() {
    safari.extension.popovers[0].contentWindow.postMessage({
        discussions: discussions,
        tab: {
            url: safari.application.activeBrowserWindow.activeTab.url,
            title: safari.application.activeBrowserWindow.activeTab.title
        }
    }, window.location.origin);
}