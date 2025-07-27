import connectDB from "./db/connection.js";
import authRouter from "./modules/auth/auth.controller.js";
import cors from "cors";


const bootstrap=(app,express) => {
    app.use(express.json());
    app.use(cors());
    connectDB();


    app.use("/auth", authRouter);



    app.use("/", (req, res) => {
        return res.status(404).json({
            message: "Route not found"
        });
    });
    

    //handler for unhandled errors
}

export default bootstrap;