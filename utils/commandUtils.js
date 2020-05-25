const gather = require("./gather")


displayGatherStatus = (message, alphaTickets, bravoTickets, alphaCaps, bravoCaps) => {
    // TODO: This might need different logic

    if (alphaTickets === 500 && bravoTickets === 500 && alphaCaps === 0 && bravoCaps === 0) {
        message.channel.send({
            embed: {
                color: 0xff0000,
                description: "No gather in progress!",
            }
        });
    } else {
        message.channel.send({
            embed: {
                color: 0xff0000,
                title: "Gather Info",
                description: `**Gather In Progress**\n` +
                    `:a: **Alpha** - Tickets: ${alphaTickets} - Caps: ${alphaCaps}\n` +
                    `:regional_indicator_b: **Bravo** - Tickets: ${bravoTickets} - Caps: ${bravoCaps}`,
                fields: gather.getPlayerFields()
            }
        });
    }
}

module.exports = {
    displayGatherStatus
}

