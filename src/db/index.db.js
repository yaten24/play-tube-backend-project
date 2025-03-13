import mongoose from 'monngoose';
import { DB_NAME } from 'constants.js';

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`DB is connected Succesfully !! DB_HOST: ${connectionInstance.connection.host}`)
    } catch (error) {
        console.error("Error is occured while connecting" , error);
    }
}

export default connectDB;