import Vue from "vue";
import Vuex from "vuex";
import * as utils from "./utils"

// setup Vue instance
document.addEventListener("DOMContentLoaded", function(event) {
    Vue.use(Vuex);

    var store = new Vuex.Store({
        state: {
            title: "Placeholder Title",
            url: "",
            isRefreshing: false,
            links: [{
                permalink: "",
                title: "You shouldn't be seeing this.",
                score: "0",
                age: "0 days ago",
                comments: 0,
                subreddit: "CommentsfromReddit"
            }]
        },
        mutations: {
            setTitle: function(state, title) {
                state.title = title;
            },
            setURL: function(state, url) {
                state.url = url;
            },
            enableRefreshMode: function(state) {
                state.isRefreshing = true;
            },
            disableRefreshMode: function(state) {
                state.isRefreshing = false;
            },
            setLinks: function(state, links) {
                state.links = links;
            }
        },
        actions: {
            handleDiscussions: function(context, data) {
                let orderUsing = safari.extension.settings.orderUsing;
                let orderIn = safari.extension.settings.orderIn;

                if (orderUsing == "created_utc") {
                    orderIn = (orderIn == "asc" ? "desc" : "asc"); // toggle orders to handle timestamps being inverse
                }

                let keysSorted = [];
                if (orderIn == "asc") {
                    keysSorted = Object.keys(data.discussions).sort(function(a, b){
                        return data.discussions[a].data[orderUsing] - data.discussions[b].data[orderUsing];
                    });
                } else if (orderIn == "desc") {
                    keysSorted = Object.keys(data.discussions).sort(function(a, b){
                        return data.discussions[b].data[orderUsing] - data.discussions[a].data[orderUsing];
                    });
                }

                let permalinks = [];
                for (let i = 0; i < keysSorted.length; i++) {
                    let entry = data.discussions[keysSorted[i]].data;

                    permalinks.push({
                        name: entry.name,
                        permalink: "https://www.reddit.com" + entry.permalink,
                        title: entry.title,
                        score: utils.formatScore(entry.score),
                        age: utils.formatAge(new Date(entry.created_utc * 1000)),
                        comments: entry.num_comments.toLocaleString(),
                        subreddit: entry.subreddit,
                    });
                }

                context.commit("setTitle", data.title);
                context.commit("setURL", data.url);
                context.commit("setLinks", permalinks);
                context.commit("disableRefreshMode");

                window.scrollTo(0, 0);
            },
            refreshDiscussions: function(context) {
                safari.extension.globalPage.contentWindow.postMessage({
                    action: "refresh",
                    url: context.state.url,
                    title: context.state.title
                }, window.location.origin);
            }
        }
    });

    // render new discussions
    window.addEventListener("message", function (msg) {
        store.dispatch("handleDiscussions", msg.data);
    }, false);

    new Vue({
        store,
        el: "#app",
        render: createElement => createElement(require("../components/Popover.vue"))
    });
});