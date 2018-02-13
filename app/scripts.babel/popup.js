Vue.component('toolbar', {

    data() {
        return {
            urls: '',
            active: 0,
            adding: false,
            visited: {}
        }
    },

    mounted() {
        this.loadFromMemory();
    },

    methods: {

        toggleEditing() {
            this.adding = !this.adding;
            this.active = 0;
        },

        saveLinks() {
            this.saveToMemory();
            this.toggleEditing();

            this.active = 0;
        },

        clearList()
        {
            this.urls = '';
            this.visited = {};
            this.saveToMemory();
        },

        loadFromMemory() {
            let urlArray = JSON.parse(localStorage.getItem('flem_urls') || '[]');

            chrome.storage.sync.get(['flem_active', 'flem_urls', 'flem_visited'], items => {
                let urlArray = JSON.parse(items.flem_urls || '[]');
                this.urls = urlArray.join('\n');

                this.active = items.flem_active || 0;
                this.visited = JSON.parse((items.flem_visited || '{}'));
            });
        },

        saveToMemory() {
            let urlArray = this.urls.split('\n');

            chrome.storage.sync.set({
                'flem_active': this.active,
                'flem_urls': JSON.stringify(urlArray),
                'flem_visited': JSON.stringify(this.visited)
            });
        },

        goToPage($event, newTab = false) {
            if (this.active == 0) {
                return false;
            }

            console.log('Going to ' + this.active);

            this.visited[this.active] = true;
            this.saveToMemory();

            this.$forceUpdate();

            if (newTab) {
                return chrome.tabs.create({
                    url: this.active
                });
            } else {
                return chrome.tabs.update(undefined, {
                    url: this.active
                });
            }
        },

        next() {
            let goTo = null;

            if (this.active === 0 && this.dropdown[0] !== 'undefined') {
                goTo = this.dropdown[0];
            }

            if (!goTo) {
                this.dropdown.forEach((url, key) => {
                    if (url == this.active && this.dropdown[key + 1] !== 'undefined') {
                        goTo = this.dropdown[key + 1];
                    }
                })
            }

            if (goTo) {
                this.active = goTo;

                return this.goToPage();
            }
        },

        previous() {
            let goTo = null;

            if (!goTo) {
                this.dropdown.forEach((url, key) => {
                    if (url == this.active && this.dropdown[key - 1] !== 'undefined') {
                        goTo = this.dropdown[key - 1];
                    }
                })
            }

            if (goTo) {
                this.active = goTo;

                return this.goToPage();
            }
        },

        newTabs() {
            this.dropdown.forEach(url => {
                this.visited[url] = true;

                chrome.tabs.create({
                    url: url
                });
            })

            this.saveToMemory();
        },

        openAllUnvisitedLinks() {
            this.dropdown.forEach(url => {
                if (!this.visited[url]) {
                    this.visited[url] = true;

                    chrome.tabs.create({
                        url: url
                    });
                }
            });

            this.saveToMemory();
        },

        displayUrl(url) {
            let displayUrl = url.substring(0, 50);

            if (displayUrl.length !== url.length) {
                displayUrl = displayUrl + '...';
            }

            if (this.visited[url] === true) {
                return `👌 ${displayUrl}`;
            }

            return displayUrl;
        },

        deleteUrl() {
            this.visited[this.active] = false;

            let urls = this.urls.split('\n');

            urls = urls.filter(url => {
                console.log(url, this.active);
                return url !== this.active;
            }).filter(url => { return url });

            this.urls = urls.join('\n');

            this.active = 0;

            this.saveToMemory();
        }

    },

    computed: {
        dropdown() {
            let urls = this.urls.split('\n');
            return urls.filter(el => { return el });
        }
    },

})

new Vue({
    el: '#app'
})