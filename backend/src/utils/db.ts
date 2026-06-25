import mongoose from 'mongoose'

export const connectDB = async () => {
  console.log(process.env.DATABASE_URL)
  console.log('connected');
  


  try {
    await mongoose.connect(process.env.DATABASE_URL)
    console.log('MongoDB Connected',process.env.DATABASE_URL)
    console.log('MongoDB Connected',process.env.DATABASE_URL)
    
  } catch (error) {
    console.log(error)
    return null
  }
}


