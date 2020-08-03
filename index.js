'use strict'

const Express = require('express'),
	path = require('path'),
	{host, port} = require('./config')

class LazyServer {
	constructor(mod) {
		this.mod = mod
		this.q = null
		this.app = null
		this.port = 0
		this.router = null
	}

	async get(router) {
		this.router = router // Switch active router

		if(!this.port) // Load or await
			if(!this.q) {
				this.app = await (this.q = new Promise((resolve, reject) => {
					const app = Express()
					.set('env', 'production')
					.enable('case sensitive routing')
					.disable('x-powered-by')
                    //init CoherentGT
					.get('/_TERAToolbox/browserInit.js', (req, res) => { res.sendFile(path.join(__dirname, 'browserInit.js')); })
					.use((req, res, next) => { this.router(req, res, next) })
					.use((req, res) => { res.status(404).end() })
					.use((err, req, res, next) => {
						console.error(err)
						res.status(500).end()
					})
					.listen(port, host, () => { resolve(app) })
					.on('error', reject)
				}))
				this.port = this.app.address().port
				this.q = null

				// Clean up on exit
				this.mod.dispatch.connection.serverConnection.once('close', () => { this.app.close() })
			}
			else await this.q

		return `${host}:${this.port}`
	}
}

const servers = new WeakMap()

async function getServer(router) {
	const base = router.mod.dispatch
	if(servers.has(base)) return servers.get(base).get(router)

	const server = new LazyServer(router.mod)
	servers.set(base, server)
	return server.get(router)
}

function UI(mod, options) { return UI.Router(mod, options) }

Object.assign(UI, Express, {
	Router(mod, options) {
		const router = Express.Router(options)
		Object.setPrototypeOf(router, UI.Router.prototype)
		router.mod = mod
		return router
	}
})

UI.Router.prototype = Object.assign({}, Express.Router, {
	async open(path = '/') {
		if(!path.startsWith('/')) path = '/' + path
		let url = await getServer(this) + path
		url = url.replace("http//", "http://") //is this needed? shits weird man...
		this.mod.send('S_OPEN_AWESOMIUM_WEB_URL', 1, {url})
	}
})

module.exports = UI