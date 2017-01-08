<template>
    <li :class="$style.discussion">
        <div>
            <div :class="$style.score"><p :class="$style.scoreText" v-text="discussion.score"></p></div>
        </div>
        <div :class="$style.rightColumn">
            <a :class="$style.link" @click.prevent="open" :href="discussion.permalink" v-text="discussion.title"></a>
            <div :class="$style.age"><span v-text="discussion.age"></span>,&nbsp;&nbsp;<span v-text="discussion.comments"></span> comments,&nbsp;&nbsp;/r/<span v-text="discussion.subreddit"></span></div>
        </div>
    </li>
</template>

<script>
    module.exports = {
        methods: {
            open: function (event) {
                safari.self.hide();
                safari.application.activeBrowserWindow.openTab().url = this.discussion.permalink;
            }
        },
        props: {
            discussion: {
                type: Object,
                required: true
            }
        }
    }
</script>

<style module>
.discussion {
    list-style-type: none;
    padding: 10px 15px 15px 10px;
    background: rgba(255, 255, 255, 0.3);
    display: flex;
}

.discussion:hover {
    background: rgba(204, 204, 204, 0.3);
}

.score {
    font-size: 15px;
    text-align: center;
    background: linear-gradient(to bottom, rgba(255, 178, 0, 1), rgba(255, 128, 0, 1));
    color: white;
    box-shadow: 0 1px 3px #888888;
    border-radius: 8px;
    padding: 4px 5px;
    margin: 4px 5px;
    min-width: 50px;
}

.scoreText {
    margin: 0 0 1px 0;
}

.rightColumn {
    margin-left: 10px;
}

.link {
    text-decoration: none;
    line-height: 1.4;
    color: #444444;
    font-size: 15px;
    font-weight: bold;
}

.age {
    font-size: 12px;
    color: #696969;
    margin: 5px 0 0 0;
}
</style>