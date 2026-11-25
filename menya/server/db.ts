import mongoose from 'mongoose'
import { config } from './config'

export async function connectDatabase() {
  mongoose.set('strictQuery', true)
  await mongoose.connect(config.mongoUri)
  console.log(`MongoDB connected: ${config.mongoUri}`)
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}
