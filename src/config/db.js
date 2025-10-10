import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const uri = "mongodb+srv://ramzsalogiddinov_db_user:Ramzjan200101@cluster0.of7kudg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
