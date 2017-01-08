<template>
    <div id="app">
        <div :class="$style.metaData">
            <span :class="$style.pageTitle" v-text="$store.state.title"></span>
            <span :class="$style.metaButtons">
                <a :class="$style.refreshButton" @click.prevent="refresh" href="javascript:;" title="Refresh Discussions"><img :class="refreshImageClass" @animationiteration="animationTick" :src="refreshImage"></a>
                <a :class="$style.repostButton" @click.prevent="repost" :href="resubmitURL" title="Post to Reddit">Repost</a>
            </span>
        </div>
        <div id="discussions">
            <discussion v-for="discussion in $store.state.links" :discussion="discussion" :key="discussion.name"></discussion>
        </div>
        <div :class="$style.loader" v-show="showLoadingIndicator"></div>
    </div>
</template>

<script>
module.exports = {
    data: function() {
        return {
            showLoadingIndicator: false,
            refreshImage: require("../../images/refresh.png")
        }
    },
    components: {
        Discussion: require("./Discussion.vue")
    },
    computed: {
        refreshImageClass: function() {
            return {
                [this.$style.refreshImage]: true,
                [this.$style.spinInfinite]: this.showLoadingIndicator
            }
        },
        resubmitURL: function() {
            return "https://www.reddit.com/submit?resubmit=true&url=" + encodeURIComponent(this.$store.state.url);
        }
    },
    methods: {
        repost: function() {
            safari.self.hide();
            safari.application.activeBrowserWindow.openTab().url = this.resubmitURL;
        },
        refresh: function(event) {
            this.showLoadingIndicator = true;
            this.$store.commit("enableRefreshMode");
            this.$store.dispatch("refreshDiscussions");
        },
        animationTick: function(event) {
            this.showLoadingIndicator = this.$store.state.isRefreshing;
        }
    }
}
</script>

<style module>
* {
    -webkit-user-select: none;
            user-select: none;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, verdana, arial, sans-serif;
    margin: 0;
}

.contentApart {
    display: flex;
    justify-content: space-between;
}

.metaData {
    composes: contentApart;
    padding: 10px;
    vertical-align: middle;
}

.metaButtons {
    composes: contentApart;
    margin-left: 10px;
}

.pageTitle {
    font-size: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
    margin: auto 5px;
}

.linkButton {
    text-decoration: none;
    border-radius: 3px;
    background: linear-gradient(to bottom, rgba(113, 113, 113, 1), rgba(145, 145, 145, 1) 10%);
    color: white;
    font-size: 12px;
    text-align: center;
    padding: 5px;
    font-weight: bold;
}

.linkButton:hover {
    background: linear-gradient(to bottom, rgba(255, 128, 0, 0.9), rgba(255, 178, 0, 0.9) 20%);
    -webkit-transition: background 2s;
    transition: background 2s;
}

.refreshButton {
    composes: linkButton;
    width: 20px;
}

.repostButton {
    composes: linkButton;
    margin-left: 10px;
    padding: 5px 10px;
}

.refreshImage {
    max-width: 10px;
}

.spinInfinite {
    animation: rotation 0.5s infinite linear;
    -webkit-animation: rotation 0.5s infinite linear;
}

@keyframes rotation {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
}

@-webkit-keyframes rotation {
    from { -webkit-transform: rotate(0deg); }
    to   { -webkit-transform: rotate(360deg); }
}

.loader {
    width: 100%;
    height: 100%;
    position: fixed;
    top: 0;
    left: 0;
    z-index: 999;
    background: rgba(0, 0, 0, .2);
}
</style>