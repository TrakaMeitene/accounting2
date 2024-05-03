 import {createRequire} from "module"
 const require = createRequire(import.meta.url)

const express = require('express'); 
import routsHandler from "./routes/controller.js"

const app = express(); 
const PORT = 3300; 
app.use("/", routsHandler);

app.listen(PORT, (error) =>{ 
    if(!error) 
        console.log("Server is Successfully Running, "+ PORT) 
    else 
        console.log("Error occurred, server can't start", error); 
    } 
); 