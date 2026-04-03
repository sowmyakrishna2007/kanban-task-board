# Kanban-Style Task Board

This project is a Kanban-style Task Board where users can create and categorize tasks based on labels, priorities, and current work state.

Below are the setup instructions:

# SETUP INSTRUCTIONS:

Set up Prerequisites

● Node.js

● Python

● A Supabase project with the tables and RLS policies set up (see SQL schema above)

# Clone the repo

In terminal:

git clone https://github.com/sowmyakrishna2007/kanban-task-board.git

cd kanban-task-board

# Setup the backend

In the terminal:

cd backend

python -m venv venv

source venv/bin/activate # Windows: venv\Scripts\activate

pip install -r requirements.txt

Create a .env file in the backend folder:

SUPABASE_URL= [your project URL from Supabase]

SUPABASE_ANON_KEY= [your anon key from Supabase]

# Start the Flask server:

In the terminal:

python app.py

This backend now runs on http://localhost:8080

# Setup frontend

In the terminal:

cd ../frontend

npm install

Create a .env.local file in the frontend folder:

VITE_API_URL=http://localhost:8080

VITE_SUPABASE_URL= [your project URL from Supabase]

VITE_SUPABASE_ANON_KEY= [your anon key from Supabase]

Start the dev server:

In the terminal:

npm run dev

The frontend now runs on http://localhost:5173

# Open the app

Open http://localhost:5173, all website features should be accessible!


