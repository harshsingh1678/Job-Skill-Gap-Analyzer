require("dotenv").config()
const app = require("./src/app")
const connectToDB = require("./src/config/database")


const port = process.env.PORT || 4000

async function startServer() {
    await connectToDB()

    app.listen(port, () => {
        console.log(`Server is running on port ${port}`)
    })
}

startServer()