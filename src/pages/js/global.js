const ytRegex = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
const timerInterval = 1000;
var domainBlacklist = safari.extension.settings.domainBlacklist.split(" ");
var subredditBlacklist = safari.extension.settings.subredditBlacklist.toUpperCase().split(" ");
var cacheTimeout = safari.extension.settings.cacheTimeout;
var lastUrl;
var lastTitle;
var lastDiscussions;
var timer;

// start the extension loop
localStorage.clear();
resetVariables();
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
    let newUrl = getCurrentURL();

    if (lastUrl === newUrl) {
        // same URL; do nothing
        startTimer();
    } else {
        // new URL; update badge and discussions
        if (newUrl === null) {
            // null URL; disable badge and clear discussions
            resetVariables();
            disableBadge();
            startTimer();
        } else {
            // valid URL; fetch discussions
            getURLInfo(newUrl);
        }
    }
}

function resetVariables() {
    lastUrl = null;
    lastTitle = null;
    lastDiscussions = {};
}

function startTimer() {
    timer = setTimeout(checkCurrentURL, timerInterval);
}

function stopTimer() {
    clearTimeout(timer);
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

function getCurrentTitle() {
    // http://stackoverflow.com/questions/22311203/how-to-fix-typeerror-null-is-not-an-object-evaluating-event-relatedtarget
    if (safari && safari.application && safari.application.activeBrowserWindow && safari.application.activeBrowserWindow.activeTab && safari.application.activeBrowserWindow.activeTab.title) {
        return safari.application.activeBrowserWindow.activeTab.title;
    } else {
        return "";
    }
}

function getCurrentURL() {
    // http://stackoverflow.com/questions/22311203/how-to-fix-typeerror-null-is-not-an-object-evaluating-event-relatedtarget
    if (safari && safari.application && safari.application.activeBrowserWindow && safari.application.activeBrowserWindow.activeTab && safari.application.activeBrowserWindow.activeTab.url) {
        return safari.application.activeBrowserWindow.activeTab.url.split("#")[0];
    } else {
        return null;
    }
}

function getURLInfo(newUrl, newTitle = getCurrentTitle(), forceRefresh = false) {
    return new Promise(function(resolve, reject) {
        stopTimer();

        lastUrl = newUrl;
        lastTitle = newTitle;

        let currentURL = new URL(newUrl);
        if (domainBlacklist.includes(currentURL.hostname.toUpperCase())) {
            lastDiscussions = {};

            disableBadge();
            startTimer();

            resolve();
        } else {
            let urls = constructURLs(newUrl);
            for (let i = 0; i < urls.length; i++) {
                urls[i] = fetchPosts(urls[i], forceRefresh);
            }

            Promise.all(urls).then(function(results) {
                lastDiscussions = {};

                let posts = [].concat.apply([], results);
                for (let i = 0; i < posts.length; i++) {
                    if (posts[i].data.subreddit) {
                        if (subredditBlacklist.includes(posts[i].data.subreddit.toUpperCase()) === false) {
                            lastDiscussions[posts[i].data.name] = posts[i];
                        }
                    }
                }

                updateBadge();
                startTimer();

                resolve();
            }).catch(function(error) {
                lastDiscussions = {};

                disableBadge();
                startTimer();

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

                if ((Math.floor(Date.now() / 1000) - cachedPosts.time) <= cacheTimeout) {
                    performRequest = false;
                    resolve(cachedPosts.posts);
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
    if (lastUrl === getCurrentURL()) {
        lastTitle = getCurrentTitle();
    }

    safari.extension.popovers[0].contentWindow.postMessage({
        url: lastUrl,
        title: lastTitle,
        discussions: lastDiscussions
    }, window.location.origin);
}