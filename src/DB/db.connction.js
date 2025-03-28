import mongoose from "mongoose";

export const conctionDB = async () => {
    await mongoose.connect(process.env.DB_URL).then(() => {
        console.log("Conction DB Successfully");
    }).catch((error) => {
        console.log(error.message)
    })
}