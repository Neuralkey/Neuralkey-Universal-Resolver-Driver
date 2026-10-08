import express, { Request, Response } from "express";
import { getNeuralKeyResolver } from "./util/neuralkeyGlobalResolver";
const app = express();
const port = process.env.PORT || 8080;

app.get('/1.0/identifiers/:identifier', async (req: Request, res: Response) => {
    const { identifier } = req.params;
    if (!identifier) {
        return res.json({
            message: 'no identifier.',
            error: 'bad request',
            statusCode: 400
        })
    }
    const didDoc = await getNeuralKeyResolver().neuralkey(identifier as string);
    return res.json({
        ...didDoc
    });
})

app.listen(port, () => {
    console.log("Running server on ports : ", port);
})