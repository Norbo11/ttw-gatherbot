const pino = require('pino')
const logger = require("../utils/logger")

// Passing pino.destination() here enables synchronous logging, which is slower but doesn't lose messages prior to process.exit()
const log = pino({
    prettyPrint: {
        levelFirst: true
    },
    prettifier: require('pino-pretty'),
    level: "info"
}, pino.destination())

module.exports = {
    log
}