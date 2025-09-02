const express=require("express");
const cors=require("cors");
const bodyPArser=require("body-parser");
const dotEnv=require("dotenv");
const mongoose=require("mongoose");

const app=express();

app.use(cors());
app.use(bodyPArser.json());
dotEnv.config();
mongoose.connect(process.env.Mongo_DB)
        .then(()=>{
            console.log("database connected successfully...")
        })
        .catch((e)=>{
            console.log("Database error due to",e)
        })

app.get("/",(req,res)=>{
    res.send("Inializing Backend...");
})

app.use("/api/items", require("./Routes/route"));

const PORT=process.env.PORTS || 3001;

app.listen(PORT,()=>{
    console.log(`This server is listening On http://localhost:${PORT}`);
})