const express = require('express')
const server = express()
const fs = require('fs')
const readFileAsync = require('util').promisify(fs.readFile)
const resolve = file => require('path').resolve(__dirname, file)
const { createBundleRenderer } = require('vue-server-renderer')
const isProd = process.env.NODE_ENV === 'production'

function createRenderer(bundle, options) {
    return createBundleRenderer(bundle, Object.assign(options,{
        baseDir: resolve('./dist/'),
        runInNewContext: false
    }))
}


let renderer
let readyPromise
const templatePath = resolve('./index.template.html')

if(isProd){
    const template = fs.readFileSync(templatePath, 'utf-8')
    const bundle = require('./dist/vue-ssr-server-bundle.json')
    renderer = createRenderer(bundle, {
        template
    })
}else{
    readyPromise = require('./build/setup-dev-server')(
        server,
        templatePath,
        (bundle, options) => {
            renderer = createRenderer(bundle, options)
        }
    )
}
const serve = (path, cache) =>  express.static(resolve(path),{
    maxAge: cache && isProd ? 1000 * 60 * 60 * 24 *30 : 0
})
server.use('/dist',serve('./dist',true))

function render(req, res){
    const s = Date.now()

    res.setHeader('Content-Type', 'text/html')

    const handleError = err => {
        if (err.url){
            res.redirect(err.url)
        } else if(err.code === 404) {
            res.status(404).send('404 | Page Not Found')
        } else{
            res.status(500).send('500 | Internal Server Error')
            console.error(`error during render : ${req.url}`)
            console.error(err.stack)
        }
    }
    const context = {
        title: 'IamTitle',
        url:req.url
    }
    renderer.renderToString(context, (err ,html) => {
        if (err){
            return handleError(err)
        }
        res.send(html)
        if(!isProd){
            console.log(`whole request: ${Date.now() - s}ms`)
        }
    })
}

server.get('*',isProd ? render : (req, res) => {
    readyPromise.then(() => render(req, res))
})

const port = process.env.PORT || 3000

server.listen(port, () => {
    console.log(`server started at localhost: ${port}`)
})