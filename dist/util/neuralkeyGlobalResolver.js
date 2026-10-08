"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNeuralKeyResolver = getNeuralKeyResolver;
const did_resolver_1 = require("did-resolver");
const web_did_resolver_1 = __importDefault(require("web-did-resolver"));
const { driver } = require('@digitalbazaar/did-method-key');
const { Ed25519VerificationKey2020 } = require('@digitalbazaar/ed25519-verification-key-2020');
// 1. Setup underlying drivers
const keyDriver = driver();
keyDriver.use({
    multibaseMultikeyHeader: 'z6Mk',
    fromMultibase: Ed25519VerificationKey2020.from
});
const webResolver = web_did_resolver_1.default.getResolver();
const didResolver = new did_resolver_1.Resolver(Object.assign({}, webResolver));
// 2. Define the Universal Compatible Resolver
function getNeuralKeyResolver() {
    return {
        neuralkey: (did, resolver, parsed, options) => __awaiter(this, void 0, void 0, function* () {
            try {
                let rawResult;
                const identifier = did.split(':')[2];
                // A. Route to underlying method
                if (identifier.startsWith('z6Mk')) {
                    const underlyingDid = `did:key:${identifier}`;
                    // did-method-key returns just the document, we need to wrap it in a resolution result
                    const rawDocument = yield keyDriver.get({ did: underlyingDid });
                    rawResult = {
                        didDocument: rawDocument,
                        didResolutionMetadata: { contentType: "application/did+ld+json" },
                        didDocumentMetadata: {}
                    };
                }
                else {
                    const underlyingDid = `did:web:${identifier}`;
                    // web-did-resolver already returns a standard DIDResolutionResult
                    rawResult = yield didResolver.resolve(underlyingDid);
                    // rawResult = await webResolver.web(underlyingDid, { ...parsed, id: identifier, did: underlyingDid }, resolver, options);
                }
                // B. Translate Out (Replace underlying prefixes with did:neuralkey)
                if (rawResult && rawResult.didDocument) {
                    let docString = JSON.stringify(rawResult.didDocument);
                    // Replace did:key:<id> or did:web:<id> with did:neuralkey:<id>
                    const underlyingDidRegex = identifier.startsWith('z') ? `did:key:${identifier}` : `did:web:${identifier}`;
                    docString = docString.replace(new RegExp(underlyingDidRegex, 'g'), did);
                    rawResult.didDocument = JSON.parse(docString);
                    rawResult = {
                        didDocument: rawResult.didDocument,
                        didResolutionMetadata: { contentType: "application/did+ld+json" },
                        didDocumentMetadata: {}
                    };
                }
                return rawResult;
            }
            catch (error) {
                return {
                    didResolutionMetadata: { error: 'notFound', message: error },
                    didDocument: null,
                    didDocumentMetadata: {}
                };
            }
        })
    };
}
