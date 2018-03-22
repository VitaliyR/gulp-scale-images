'use strict'

const PluginError = require('plugin-error')
const through = require('through2')

const resize = require('./lib/resize')
const pkgName = require('./package.json').name

const isObj = o => o !== null && 'object' === typeof o && !Array.isArray(o)

const createScaleImagesPlugin = () => {
	const out = through.obj(function processFile(input, _, cb) {
		const onErr = (msg) => {
			const err = new PluginError(pkgName, {message: msg})
			err.file = input
			out.emit('error', err)
			cb()
		}

		if (!input || 'function' !== typeof input.isDirectory) {
			return onErr('invalid vinyl file passed')
		}
		if (input.isStream()) return onErr('streaming files are not supported')
		if (input.isDirectory()) return cb() // ignore directories

		const s = input.scale
		if (!isObj(s)) {
			return emitErr('file.scale must be an object')
		}
		if ('number' !== typeof s.maxWidth) {
			return emitErr('file.scale.maxWidth must be a number')
		}
		if ('number' !== typeof s.maxHeight) {
			return emitErr('file.scale.maxHeight must be a number')
		}
		if (s.format && 'string' !== typeof s.format) {
			return emitErr('file.scale.format must be a string')
		}
		if (s.withoutEnlargement && 'boolean' !== typeof s.withoutEnlargement) {
			return emitErr('file.scale.withoutEnlargement must be a boolean')
		}

		const self = this
		resize(input, input.scale, (err, output) => {
			if (err) out.emit('error', err)
			else self.push(output)
			cb()
		})
	})

	return out
}

createScaleImagesPlugin.SHARP_INFO = resize.SHARP_INFO
module.exports = createScaleImagesPlugin
