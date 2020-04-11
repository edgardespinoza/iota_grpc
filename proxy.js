var path = require('path');
var iota = require('./iotaUtil');
var vc = require('./verifiableCrential')



module.exports = {
    getCredential: async(root) => {
        return await iota.getCertificate(root)
    },

    validate: async(vcBody, root) => {
        var t = typeof vcBody;

        console.log('type: ', t);

        vcBody = JSON.parse(vcBody)

        let isValid = vc.validate(vcBody)

        if (isValid) {
            let vcc = await iota.getCertificate(root)
            isValid = vc.getKeccak256(vcBody) == vc.getKeccak256(vcc)
        }

        return isValid;
    }

};