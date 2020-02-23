var express = require('express');
var app = express();
var path = require('path');
var iota = require('./iotaUtil');
var vc = require('./verifiableCrential')

app.use(express.json())

app.post('/register-credential', function(req, res) {
    (async function() {
        try {
            console.log(iota.seed())

            res.send(await iota.register(vc.sign(req.body.credentialSubject, iota.seed())))
        } catch (E) {
            console.log(E)
            res.send(`{"error": "${E}"}`)
        }

    })();
});


app.post('/get-credential', function(req, res) {
    (async function() {
        try {
            console.log("get-credential=>", req.body.root)

            res.send(await iota.getCertificate(req.body.root))
        } catch (E) {
            console.log(E)
            res.send(`{"error": "${E}"}`)
        }

    })();
});

app.post('/validate-credential', function(req, res) {
    (async function() {
        try {
            console.log("validate-credential=>", req.body.vc)

            let isValid = vc.validate(req.body.vc)


            if (isValid) {
                let vcc = await iota.getCertificate(req.body.root)
                isValid = vc.getKeccak256(req.body.vc) == vc.getKeccak256(vcc)
            }
            res.send(`{"isCorrect":${isValid}}`)

        } catch (E) {
            console.log(E);
            res.send(`{"error": "${E}"}`);
        }
    })();
});

app.listen(process.env.PORT || 4000, function() {
    console.log('Node app is working!');
});