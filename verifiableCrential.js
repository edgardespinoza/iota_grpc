const EC = require('elliptic').ec;
const CryptoJS = require('crypto-js');
const ec = new EC('secp256k1');
const sigFormatter = require('ecdsa-sig-formatter');
const keccak256 = require('js-sha3').keccak256;
var mnid = require('./mnid')



function createDidPlubic(publickey) {

    let addressPublic = publicToAddress(publickey);

    var mnidencode = mnid.encode({
        network: '0x1', // the hex encoded network id or for private chains the hex encoded first 4 bytes of the genesis hash
        address: addressPublic
    })

    return `did:iota:${mnidencode}`;
}

function createDidDni(dni) {

    let dnihex = Buffer.from(dni, 'utf8').toString('hex');

    var mnidencode = mnid.encode({
        network: '0x1', // the hex encoded network id or for private chains the hex encoded first 4 bytes of the genesis hash
        address: dnihex
    })

    return `did:dni:${mnidencode}`;
}

function publicToAddress(publicKeyInput) {

    const hashOfPublicKey = keccak256(Buffer.from(publicKeyInput, 'hex'));

    const ethAddressBuffer = Buffer.from(hashOfPublicKey, 'hex');

    let ethAddress = ethAddressBuffer.slice(-20).toString('hex');

    const ethAddressWithPrefix = `0x${ethAddress}`;
    return ethAddressWithPrefix;
}

//console.log('address to value ==> ' + publicToAddress('5902b061275c39d049e733dc12e5e1d353e86665ef2d706557059a8da1faa4bdf8f024bc139146469594f09fdcfa41972408a0bb3473b7a674cb55dc237f6ad3'));


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

function generatePrivateKey(rawPrivateKey) {

    bufferKey = Buffer.from(rawPrivateKey, 'hex');
    return ec.keyFromPrivate(bufferKey);

}

function generatePublicKeyCoordinateXY(rawPrivateKey) {

    bufferKey = Buffer.from(rawPrivateKey, 'hex');
    let privateKeyObject = ec.keyFromPrivate(bufferKey);
    let pubPoint = privateKeyObject.getPublic();

    return pubPoint.encode('hex');
}


function calculateSignature(privateKeyObject, vc) {

    let signingInputHash = Buffer.from(CryptoJS.SHA256(base64url(CryptoJS.enc.Utf8.parse(JSON.stringify(vc)))).toString(), 'hex')
    let derSignature = Buffer.from(privateKeyObject.sign(signingInputHash).toDER())
    return sigFormatter.derToJose(derSignature, 'ES256')

}



const vcTemplate = {
    '@context': ['https://w3.org/2018/credentials/v1', 'https://schema.org/Person'],
    "type": ["VerifiableCredential", "PersonCredential"],
    "issuer": "",
    "issuanceDate": (new Date()).toISOString(),
    "credentialSubject": {
        "id": createDidDni('40063820'),
        "givenName": "Edgard",
        "taxID": "40063820",
        "telephone": "994001406"
    }
}


const proofTemplate = {
    //secp256k1
    "type": "ES256K",

    "created": (new Date()).toISOString(),

    "proofPurpose": "assertionMethod",

    "verificationMethod": "public key",

    "jws": ""
}



function addSignature(vc, seed) {
    let privateKeyObject = ec.keyFromPrivate(Buffer.from(seed, 'hex'));
    let pubPoint = privateKeyObject.getPublic().encode('hex').substr(2);


    vc.issuer = createDidPlubic(pubPoint);

    vc.proof = proofTemplate;
    vc.proof.verificationMethod = pubPoint;
    delete vc.proof["jws"]
    let joseSignature = calculateSignature(privateKeyObject, vc);

    let header = {
        'alg': 'ES256K'
    };

    let stringifiedHeader = CryptoJS.enc.Utf8.parse(JSON.stringify(header));
    let encodedHeader = base64url(stringifiedHeader);

    vc.proof.jws = `${encodedHeader}..${joseSignature}`;
    return vc;
}
//console.log(getSignature(vc, seed_iota_hex));

function validateSignature(vc) {

    let jws = vc.proof["jws"]
    delete vc.proof["jws"]

    let publicKeyObject = ec.keyFromPublic(`04${vc.proof["verificationMethod"]}`, 'hex')

    let derSignature = sigFormatter.joseToDer(jws.split('.')[2], 'ES256')

    let stringified = Buffer.from(CryptoJS.SHA256(base64url(CryptoJS.enc.Utf8.parse(JSON.stringify(vc)))).toString(), 'hex')

    let valid = publicKeyObject.verify(stringified, derSignature)

    vc.proof.jws = jws

    return valid;

}

function getKeccak256(value) {
    return keccak256(Buffer.from(value.toString(), 'hex'));
}

function sign(subject, seed) {

    subject.id = createDidDni(subject.taxID);

    let seed_hex = Buffer.from(seed, 'utf8').toString('hex');
    vcTemplate.credentialSubject = subject
    let sign = addSignature(vcTemplate, seed_hex)

    return sign;
}

module.exports = {

    sign: (subject, seed) => {
        return sign(subject, seed)
    },
    validate: (vc) => {
        return validateSignature(vc)
    },
    createDidDni: (dni) => {
        return createDidDni(dni)
    },
    getKeccak256: (value) => {
        return getKeccak256(value)
    }
}

/*
console.log(
    sign({
        "credentialSubject": {
            "id": createDidDni('40063820'),
            "givenName": "Edgard Espinoza",
            "taxID": "40063820",
            "telephone": "994001406"
        }
    }, seed_iota));*/

/*
console.log(validateSignature({
    '@context': ['https://w3.org/2018/credentials/v1', 'https://schema.org/Person'],
    type: ['VerifiableCredential', 'VerifiablePerson'],
    issuer: 'did:iota:cwMLP2iAgpkCHEZHQu2Ha8uFV7BCUBoW9WA3Q',
    issuanceDate: '2020-02-22T13:00:43.712Z',
    credentialSubject: {
        credentialSubject: {
            id: 'did:dni:2gkdpYAEUM9vdBwbMGKn',
            givenName: 'Edgard Espinoza',
            taxID: '40063820',
            telephone: '994001406'
        }
    },
    proof: {
        type: 'ES256K',
        created: '2020-02-22T13:00:43.714Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: '59a61a65658582d5932affe57b3347a30b390e5f2562f15a5ef263c790ac61df52a79233baf20331342de661bf9bbbe875cf7034decb579cc8a4f96f6ba3dff8',
        jws: 'eyJhbGciOiJFUzI1NksifQ..dyqC2ySB3n68-CQ15mvEWS4AQ2nZ1NO6jact3DGnJwW-oRzhx42KfWRJy1Id4hGgHPM9lznUmfpvA3G9gh0fCg'
    }
}));*/