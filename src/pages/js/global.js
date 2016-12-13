localStorage.clear();
const ytRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
var discussions = {};

var blacklist = safari.extension.settings.blacklist.split(" ");
safari.extension.settings.addEventListener("change", settingChanged, false);
function settingChanged(event) {
    if (event.key == "blacklist") {
        blacklist = event.newValue.split(" ");

        lastUrl = "";
        getURLInfo(safari.application.activeBrowserWindow.activeTab.url.split("#")[0]);
    }
}

var lastUrl = null;
function checkURL() {
    let newUrl;
    if (safari.application.activeBrowserWindow.activeTab.url) {
        newUrl = safari.application.activeBrowserWindow.activeTab.url.split("#")[0];
    } else {
        newUrl = null;
    }

    if (lastUrl === newUrl) {
        // same URL; do nothing
        setTimeout(checkURL, 1000);
    } else {
        // new URL; update badge and discussions
        if (newUrl === null) {
            // null URL; disable badge and clear discussions
            discussions = {};
            lastUrl = null;
            disableBadge();
            setTimeout(checkURL, 1000);
        } else {
            // valid URL; fetch discussions
            getURLInfo(newUrl).then(function(results) {
                lastUrl = newUrl;
                updateBadge();
                setTimeout(checkURL, 1000);
            });
        }
    }
}

function disableBadge() {
    setBadge(null, true);
}

function updateBadge() {
    let discussionsCount = Object.keys(discussions).length;
    if (discussionsCount > 0) {
        setBadge(discussionsCount, false);
    } else {
        disableBadge();
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
    return new Promise(function(resolve, reject) {
        let currentURL = new URL(newUrl);
        if (blacklist.indexOf(currentURL.hostname) > -1) {
            discussions = {};

            resolve();
        } else {
            let urls = constructURLs(newUrl);
            for (let i = 0; i < urls.length; i++) {
                urls[i] = fetchPosts(urls[i], forceRefresh);
            }

            Promise.all(urls).then(function(results) {
                let posts = [].concat.apply([], results);

                discussions = {};
                for (let i = 0; i < posts.length; i++) {
                    discussions[posts[i].data.name] = posts[i];
                }

                resolve();
            });
        }
    });
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

function fetchPosts(searchURL, forceRefresh) {
    return new Promise(function(resolve, reject) {
        let performRequest = true;

        if (forceRefresh === false) {
            let cacheCheck = localStorage.getItem(searchURL);
            if (cacheCheck) {
                let cachedPosts = JSON.parse(cacheCheck);

                if ((Math.floor(Date.now() / 1000) - cachedPosts["time"]) <= 3600) {
                    performRequest = false;
                    resolve(cachedPosts["posts"]);
                }
            }
        }

        if (performRequest) {
            let infoRequest = new XMLHttpRequest();
            infoRequest.open("GET", "https://www.reddit.com/api/info.json?url=" + searchURL, true);

            infoRequest.onreadystatechange = function() {
                if (infoRequest.readyState == 4) {
                    if (infoRequest.status == 200) {
                        let jsonInfo = JSON.parse(infoRequest.responseText);

                        try {
                            localStorage.setItem(searchURL, JSON.stringify({
                                time: Math.floor(Date.now() / 1000),
                                posts: jsonInfo.data.children
                            }));
                        } catch (e) {
                            localStorage.clear();
                        }

                        resolve(jsonInfo.data.children);
                    } else {
                        resolve([]);
                    }
                }
            };

            infoRequest.send();
        }
    });
}

window.addEventListener("message", function (msg) {
    getURLInfo(msg.data.url, true).then(function(results) {
        lastUrl = msg.data.url;
        updateBadge();
        pushDiscussions();
    });
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

disableBadge();
checkURL();