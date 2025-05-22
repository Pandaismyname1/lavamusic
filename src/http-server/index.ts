import express from 'express';
import {env} from '../env';
import {createSimpleEndpoint} from "./utils";

// Create Express server
export const app = express();
const PORT = env.EXPRESS_PORT;

// @ts-ignore
createSimpleEndpoint(app, "play", true);
createSimpleEndpoint(app, "pause", false);
createSimpleEndpoint(app, "resume", false);
createSimpleEndpoint(app, "stop", false);
createSimpleEndpoint(app, "skip", false);

// Start the Express server
app.listen(PORT, () => {

});
