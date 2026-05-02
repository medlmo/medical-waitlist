#!/bin/bash
# Start backend
node backend/server.js &

# Start frontend
npm run dev
