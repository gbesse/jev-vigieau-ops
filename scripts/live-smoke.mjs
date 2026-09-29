// Purpose: Make one explicitly requested synthetic Jev call.
import { createJevClient } from "../src/jev.mjs";
const client=createJevClient();
const response=await client.decide({state:{project:"jev-vigieau-ops",text:"synthetic smoke test"},questions:{decision:{type:"choice",instructions:"Classify this synthetic text.",criteria:{relevant:"Relevant",unrelated:"Unrelated"}}}});
console.log(JSON.stringify({model:response.model,usage:response.usage},null,2));
