import { DIDResolutionResult, Resolver } from 'did-resolver';
import webDidResolver from 'web-did-resolver';
const { driver } = require('@digitalbazaar/did-method-key');
const { Ed25519VerificationKey2020 } = require('@digitalbazaar/ed25519-verification-key-2020');

// 1. Setup underlying drivers
const keyDriver = driver();
keyDriver.use({
    multibaseMultikeyHeader: 'z6Mk',
    fromMultibase: Ed25519VerificationKey2020.from
});
const webResolver: any = webDidResolver.getResolver();
const didResolver = new Resolver({
    ...webResolver
});

// 2. Define the Universal Compatible Resolver
export function getNeuralKeyResolver() {
    return {
        neuralkey: async (did: string, resolver?: any, parsed?: any, options?: any): Promise<DIDResolutionResult> => {
            try {
                let rawResult;
                const identifier = did.split(':')[2];
                // A. Route to underlying method
                if (identifier.startsWith('z6Mk')) {
                    const underlyingDid = `did:key:${identifier}`;
                    // did-method-key returns just the document, we need to wrap it in a resolution result
                    const rawDocument = await keyDriver.get({ did: underlyingDid });
                    rawResult = {
                        didDocument: rawDocument,
                        didResolutionMetadata: { contentType: "application/did+ld+json" },
                        didDocumentMetadata: {}
                    };
                } else {
                    const underlyingDid = `did:web:${identifier}`;
                    // web-did-resolver already returns a standard DIDResolutionResult
                    rawResult = await didResolver.resolve(underlyingDid);
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
            } catch (error) {
                return {
                    didResolutionMetadata: { error: 'notFound', message: error },
                    didDocument: null,
                    didDocumentMetadata: {}
                };
            }
        }
    };
}