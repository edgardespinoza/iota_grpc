const Mam = require('@iota/mam')
const { asciiToTrytes, trytesToAscii } = require('@iota/converter')
const mode = 'restricted'
const secretKey = '9ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const provider = 'https://nodes.devnet.iota.org'
const seed = "EODUHYWPVPOJREITYLLTHLZZOVHJTSOC9KXZHBJTR9OQHHGMEBFOYLAQDBCFLKWPTHMTEJJQIIGESEVPO"

let mamState = Mam.init(provider, seed)
mamState = Mam.changeMode(mamState, mode, secretKey)




const mamExplorerLink = `https://mam-explorer.firebaseapp.com/?provider=${encodeURIComponent(provider)}&mode=${mode}&key=${secretKey.padEnd(81, '9')}&root=`

// Publish to tangle
const publish = async packet => {
    // Create MAM Payload - STRING OF TRYTES
    const trytes = asciiToTrytes(JSON.stringify(packet))
    const message = Mam.create(mamState, trytes)

    // Save new mamState
    mamState = message.state


    //console.log('Root new : ', message.root)
    //console.log('Address: ', message.address)
    // Attach the payload
    await Mam.attach(message.payload, message.address, 3, 11)

    // console.log('Published', packet, '\n');
    return message.root
}

const publishAll = async(item) => {
    const root = await publish(item)

    console.log(' root ', root)
    return `{"root":"${root}"}`
}

const readPublish = async(root) => {
    const result = await Mam.fetch(root, mode, secretKey)
    console.log(result)

    var cadena = "";
    result.messages.forEach(message => {
        cadena = cadena + trytesToAscii(message) + '\n'

    })
    return cadena
}

const readAll = async() => {
        let root = Mam.getRoot(mamState);
        var cadena = ""
        while (true) {

            const result = await Mam.fetch(root, mode, secretKey)

            result.messages.forEach(message => {
                //  console.log('Fetched and parsed', JSON.parse(trytesToAscii(message)), '\n')
                cadena = cadena + trytesToAscii(message) + '\n'

            })

            console.log(root, result.nextRoot, result.nextRoot == root)
            if (root == result.nextRoot) {
                break
            }
            root = result.nextRoot

        }
        console.log(cadena);

    }
    // (async function() {
    //     await readAll()
    //  })();
module.exports = {
    register: async(item) => {
        return await publishAll(item);
    },
    getCertificate: async(root) => {
        return await readPublish(root);
    },
    seed: () => {
        return seed;
    }

};