const routes=require("./router/router")
const cors=require("cors")
const express=require("express")

const app=express()

app.use(cors())
app.use(express.json())
app.use('/images', express.static('public/images'))
app.use("/events",routes)

app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.url} not found` })
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).json({ error: 'Something went wrong on the server' })
})

module.exports = app