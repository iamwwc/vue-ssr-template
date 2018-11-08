<template>
    <div id="app">
        current: {{ url }}
    </div>
</template>

<script>
import {mapState} from 'vuex'
export default {
    asyncData({ store, route:{path}}){
        store.state.url = path
    },
    data () {
        return {
            id: 0,
            url: this.$store.state.url
        }
    },
    computed:{
        ...mapState(['url'])
    },
    created () {
        var a 
    }
}
</script>

