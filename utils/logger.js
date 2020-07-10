const pino = require('pino')
const pinoms = require('pino-multi-stream');
const pinoPretty = require('pino-pretty');
const fs = require('fs');

streams = [
    {
        stream: fs.createWriteStream("./ttw-gatherbot.log", {
            flags: "a" // append mode
        }),
        level: "debug"
    },
    {
        stream: pinoms.prettyStream({
            prettyPrint: {
                levelFirst: true,
                colorize: true,
            },
            prettifier: pinoPretty
        }),
        level: "debug"
    }
]

const log = pino({
}, pinoms.multistream(streams))

module.exports = {
    log
}