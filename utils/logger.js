const pino = require('pino')
const logger = require("../utils/logger")

const log = pino({
    prettyPrint: {
        levelFirst: true
    },
    prettifier: require('pino-pretty')
})

module.exports = {
    log
}