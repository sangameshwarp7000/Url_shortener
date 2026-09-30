const express = require('express')
const cors = require('cors')
const urlRoutes = require('./routes/urlRoutes')

const app = express();
const PORT = 3000;

app.use(
    cors({
        origin: ["http://localhost:4200"],
        credentials: false,
    }),
);

app.use(express.json());

app.use("/api", urlRoutes);

app.get("/", (req,res)=>{
    res.status(200).send("Home Page")
})

app.get("/api/health", (req,res)=>{
    res.status(200).send("Health checkpoint triggered")
})

app.listen(PORT, ()=>{
    console.log(`Server is running on Port ${PORT}`);
})