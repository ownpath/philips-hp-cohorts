import mongoose from 'mongoose';
import config from './db.config';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/insurtech';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('📦 Connected to MongoDB');

        // Handle connection events
        mongoose.connection.on('error', (err) => {
            console.error('MongoDB error:', err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('MongoDB disconnected. Attempting to reconnect...');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('MongoDB reconnected');
        });

    } catch (error) {
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};

export default connectDB;