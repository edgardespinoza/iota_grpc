const CryptoJS = require('crypto-js');
const EC = require('elliptic').ec;
const sigFormatter = require('ecdsa-sig-formatter');
const ec = new EC('secp256k1');

function decodeBase64url(source) {
    return CryptoJS.enc.Utf8.stringify(source);
}

function base64url(source) {
    // Encode in classical base64
    let encodedSource = CryptoJS.enc.Base64.stringify(source);
    // Remove padding equal characters
    encodedSource = encodedSource.replace(/=+$/, '');
    // Replace characters according to base64url specifications
    encodedSource = encodedSource.replace(/\+/g, '-');
    encodedSource = encodedSource.replace(/\//g, '_');
    return encodedSource;
}

function validateJwt(tokenSigned) {
    let tokenParts = tokenSigned.split('.');
    let header = JSON.parse(decodeBase64url(CryptoJS.enc.Base64.parse(tokenParts[0])));

    let tokenPayload = JSON.parse(decodeBase64url(CryptoJS.enc.Base64.parse(tokenParts[1])));


    if (header.alg === 'ES256K') {
        //Sign token
        let signingInputHash = Buffer.from(CryptoJS.SHA256(`${tokenParts[0]}.${tokenParts[1]}`).toString(), 'hex');

        //prepare the public key

        // console.log(tokenPayload.iss);

        let publicKeyObject = ec.keyFromPublic(`04${tokenPayload.iss}`, 'hex');

        //Signature
        let joseSignature = tokenParts[2];
        // console.log(joseSignature);

        let derSignature = sigFormatter.joseToDer(joseSignature, 'ES256');

        //console.log(derSignature);
        // verify the token
        const isValid = publicKeyObject.verify(signingInputHash, derSignature);
        // Get content of the jwt
        const base64 = tokenSigned.split('.')[1];
        const payloadJwt = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
        return { isValid, payloadJwt };
    } else if (header.alg === 'HS256') {
        // Get content of the jwt
        const base64 = tokenSigned.split('.')[1];
        const payloadJwt = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));
        return { payloadJwt };
    } else {
        throw 'supported algorithm: ES256K and HS256';
    }
}

function generateJwt(did, audience, params = {}, privateKey) {
    let rawPrivateKey = privateKey;
    let bufferKey;
    // prepare the private key
    if (!rawPrivateKey) {
        throw 'a private key is required';
    }
    if (rawPrivateKey.length === 66) {
        rawPrivateKey = rawPrivateKey.slice(2);
    }

    bufferKey = Buffer.from(rawPrivateKey, 'hex');
    let date = Math.floor(new Date().getTime() / 1000);
    let privateKeyObject = ec.keyFromPrivate(bufferKey);

    let pubPoint = privateKeyObject.getPublic();

    /* let x = pubPoint.getX();
     let y = pubPoint.getY();

     console.log('pub x : ' + x.toString('hex'));
     console.log('pub y : ' + y.toString('hex'));

     let rawPublicKey = `${x.toString('hex')}${y.toString('hex')}`;*/
    let rawPublicKey = pubPoint.encode('hex').substr(2);
    //console.log(rawPublicKey);


    let tokenPayload = {
        'sub': did,
        'iss': rawPublicKey,
        'iat': date,
        'exp': date + 50 * 60 * 60,
        'aud': audience,
        ...params
    };
    let header = {
        'alg': 'ES256K',
        'typ': 'JWT'
    };
    let stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
    let encodedHeader = base64url(stringifiedHeader);
    let stringifiedData = CryptoJS.enc.Utf8.parse(JSON.stringify(tokenPayload));
    let encodedData = base64url(stringifiedData);
    //Token unsigned
    let token = `${encodedHeader}.${encodedData}`;

    //Sign token
    let signingInputHash = Buffer.from(CryptoJS.SHA256(token).toString(), 'hex');
    // make sure the required parameters are provided
    if (!signingInputHash) {
        throw 'a signing input hash and private key are all required';
    }
    // calculate the signature
    let signatureObject = privateKeyObject.sign(signingInputHash);
    let derSignature = Buffer.from(signatureObject.toDER());
    let joseSignature = sigFormatter.derToJose(derSignature, 'ES256');
    let tokenSigned = `${token}.${joseSignature}`;
    return tokenSigned;
}
/*
//const value = validateJwt("eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJkaWQ6ZXY6MnV2anZtOVE2Qmh1YjJMMVVUQnpHQW9FcUtqNkN1NDJnejMiLCJpc3MiOiI1OTAyYjA2MTI3NWMzOWQwNDllNzMzZGMxMmU1ZTFkMzUzZTg2NjY1ZWYyZDcwNjU1NzA1OWE4ZGExZmFhNGJkZjhmMDI0YmMxMzkxNDY0Njk1OTRmMDlmZGNmYTQxOTcyNDA4YTBiYjM0NzNiN2E2NzRjYjU1ZGMyMzdmNmFkMyIsImlhdCI6MTU3ODY2NzM1MywiZXhwIjoxNTc4ODQ3MzUzLCJhdWQiOiJkaWQ6ZXY6MnV6UTVzVFRDbmY2M3pZQ1dQaFBzZFZ4aGN5ajVicUtFdXgifQ.m4HgMsF1OdrH7ZQDijs5ay1C_JPB8kWg-rRlOkgGDiAJBT3o1hPdIOhOKeFd6e6ObLzKrTsEs2SEWGyt8oq4bg");
const value = validateJwt("eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiJkaWQ6ZXY6MnV2anZtOVE2Qmh1YjJMMVVUQnpHQW9FcUtqNkN1NDJnejMiLCJpc3MiOiJlYTc1NjRhZGU1NDM1OTVlMzE5NWU0ZGRjNWU1NjUwYWEyOWE1OTg2MjkyOTkzNmIzYjc0ZGZlYjU5Zjg2ZjBhZWZiODMwOGU3Yjk1OThkOWUwZTYwOTc3YTI5YWZlOTlkNGE1NjcxYWIyOWExN2M2ZGU3ZWMyMGUyYmVhM2Q1IiwiaWF0IjoxNTc5MTg1ODE3LCJleHAiOjE1NzkzNjU4MTcsImF1ZCI6ImRpZDpldjoydXpRNXNUVENuZjYzellDV1BoUHNkVnhoY3lqNWJxS0V1eCJ9.fbcUPRGrgPrTXtYK5gJoqyO0EibYGN3teeWaRSLU3yXFXZ_4wfAF4pZVswdQpEOC5EnSnC1lkninlxYlIuyoBA");

console.log(value);
*/

module.exports = {
    generateJwt: (did, audience, params = {}, privateKey) => {
        return generateJwt(did, audience, params = {}, privateKey);
    },

    validateJwt: (tokenSigned) => {
        return validateJwt(tokenSigned)
    }
}