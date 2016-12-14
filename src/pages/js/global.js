const ytRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
const timerInterval = 1000;
var domainBlacklist = safari.extension.settings.domainBlacklist.split(" ");
var subredditBlacklist = safari.extension.settings.subredditBlacklist.toUpperCase().split(" ");
var cacheTimeout = safari.extension.settings.cacheTimeout;
var lastUrl = null;
var lastTitle = null;
var lastDiscussions = {};
var timer;

// start the extension loop
localStorage.clear();
disableBadge();
checkCurrentURL();

safari.extension.settings.addEventListener("change", settingChanged, false);
function settingChanged(event) {
    if (event.key == "domainBlacklist") {
        domainBlacklist = event.newValue.toUpperCase().split(" ");
    } else if (event.key == "subredditBlacklist") {
        subredditBlacklist = event.newValue.toUpperCase().split(" ");
    } else if (event.key == "cacheTimeout") {
        cacheTimeout = event.newValue;
    }

    // refresh current page's posts to reflect new settings
    getURLInfo(getCurrentURL());
}

function checkCurrentURL() {
    let newUrl;
    if (safari.application.activeBrowserWindow.activeTab.url) {
        newUrl = getCurrentURL();
    } else {
        newUrl = null;
    }

    if (lastUrl === newUrl) {
        // same URL; do nothing
        timer = setTimeout(checkCurrentURL, timerInterval);
    } else {
        // new URL; update badge and discussions
        if (newUrl === null) {
            // null URL; disable badge and clear discussions
            lastUrl = null;
            lastTitle = null;
            lastDiscussions = {};
            disableBadge();

            timer = setTimeout(checkCurrentURL, timerInterval);
        } else {
            // valid URL; fetch discussions
            getURLInfo(newUrl);
        }
    }
}

function disableBadge() {
    setBadge(null, true);
}

function updateBadge() {
    let discussionsCount = Object.keys(lastDiscussions).length;
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

function getCurrentURL() {
    return safari.application.activeBrowserWindow.activeTab.url.split("#")[0];
}

function getURLInfo(newUrl, newTitle = safari.application.activeBrowserWindow.activeTab.title, forceRefresh = false) {
    return new Promise(function(resolve, reject) {
        clearTimeout(timer);

        lastUrl = newUrl;
        lastTitle = newTitle;

        let currentURL = new URL(newUrl);
        if (domainBlacklist.includes(currentURL.hostname.toUpperCase())) {
            lastDiscussions = {};

            disableBadge();
            timer = setTimeout(checkCurrentURL, timerInterval);

            resolve();
        } else {
            let urls = constructURLs(newUrl);
            for (let i = 0; i < urls.length; i++) {
                urls[i] = fetchPosts(urls[i], forceRefresh);
            }

            Promise.all(urls).then(function(results) {
                let posts = [].concat.apply([], results);

                lastDiscussions = {};
                for (let i = 0; i < posts.length; i++) {
                    if (posts[i].data.subreddit) {
                        if (subredditBlacklist.includes(posts[i].data.subreddit.toUpperCase()) === false) {
                            lastDiscussions[posts[i].data.name] = posts[i];
                        }
                    }
                }

                updateBadge();
                timer = setTimeout(checkCurrentURL, timerInterval);

                resolve();
            });
        }
    });
}

function constructURLs(url) {
    if (url.includes("http") === false) {
        return [];
    }

    let urls = [url];
    urls.push(url.replace(/^(https?:|)\/\//, ""));

    if (url.includes("youtube.com")) {
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

                if ((Math.floor(Date.now() / 1000) - cachedPosts["time"]) <= cacheTimeout) {
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
    getURLInfo(msg.data.url, msg.data.title, true).then(function(results) {
        pushDiscussions();
    });
}, false);

safari.application.addEventListener("popover", popoverEvent, false);
function popoverEvent(event) {
    pushDiscussions();
}

function pushDiscussions() {
    safari.extension.popovers[0].contentWindow.postMessage({
        url: lastUrl,
        title: lastTitle,
        discussions: lastDiscussions
    }, window.location.origin);
}